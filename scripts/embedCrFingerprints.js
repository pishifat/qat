/**
 * Compute image similarity fingerprints for legacy content review image links.
 *
 * Usage:
 *   node scripts/embedCrFingerprints.js [--dry-run] [--force] [--limit=N]
 *
 * --force recomputes existing fingerprints, e.g. ones left stale by an edited link.
 */

const mongoose = require('mongoose');
const config = require('../config.json');
const Discussion = require('../models/discussion');
const { isDiscussionImageUrl } = require('../helpers/discussionImage');
const imageFingerprintService = require('../services/imageFingerprintService');
const imageSimilarityService = require('../services/imageSimilarityService');

const ansi = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    gray: '\x1b[90m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
};

function parseArgs(argv) {
    const limitArg = argv.find((arg) => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

    return {
        dryRun: argv.includes('--dry-run'),
        force: argv.includes('--force'),
        limit: Number.isFinite(limit) && limit > 0 ? limit : null,
    };
}

function timestamp() {
    return new Date().toISOString();
}

function formatDocLabel(doc) {
    const title = doc.title || '(no title)';
    return `${title} ${ansi.dim}[${doc._id}]${ansi.reset}`;
}

function logEntry(index, total, tag, message, color) {
    const prefix = `${ansi.dim}${timestamp()}${ansi.reset} ${ansi.gray}[${index}/${total}]${ansi.reset}`;
    console.log(`${prefix} ${color}${tag}${ansi.reset} ${message}`);
}

function logInfo(message) {
    console.log(`${ansi.dim}${timestamp()}${ansi.reset} ${ansi.cyan}info${ansi.reset}  ${message}`);
}

function logSummary(summary) {
    console.log(
        `${ansi.dim}${timestamp()}${ansi.reset} ${ansi.bold}done${ansi.reset}  `
        + `${ansi.green}success=${summary.success}${ansi.reset} `
        + `${ansi.yellow}skipped=${summary.skipped}${ansi.reset} `
        + `${ansi.red}failed=${summary.failed}${ansi.reset} `
        + `${ansi.blue}dry-run=${summary.dryRun}${ansi.reset}`
    );
}

async function embedDocument(doc, options) {
    const legacyUrl = doc.discussionLink;

    if (!isDiscussionImageUrl(legacyUrl)) {
        if (doc.imageSimilarity && options.force) {
            if (options.dryRun) {
                return { status: 'dry-run', reason: 'would clear stale fingerprint' };
            }

            doc.imageSimilarity = undefined;
            doc.imageSimilarityMethod = undefined;
            await doc.save();

            return { status: 'success' };
        }

        return { status: 'skipped', reason: 'not an image link' };
    }

    if (doc.imageSimilarity && !options.force) {
        return { status: 'skipped', reason: 'already has fingerprint' };
    }

    if (options.dryRun) {
        return { status: 'dry-run', reason: 'would embed fingerprint' };
    }

    doc.imageSimilarity = await imageFingerprintService.fingerprintFromUrl(legacyUrl);
    doc.imageSimilarityMethod = imageSimilarityService.METHOD;
    await doc.save();

    return { status: 'success' };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    await mongoose.connect(config.connection);

    let query = Discussion.find({
        isContentReview: true,
        discussionLink: { $exists: true, $ne: null },
    })
        .select('_id discussionLink title imageSimilarity imageSimilarityMethod createdAt')
        .sort({ createdAt: -1 });

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const docs = await query;
    const summary = { success: 0, skipped: 0, failed: 0, dryRun: 0 };
    const total = docs.length;

    const limitLabel = options.limit ? `limit=${options.limit} (most recent)` : 'no limit';
    logInfo(
        `Processing ${ansi.bold}${total}${ansi.reset} content reviews. `
        + `${limitLabel}. dryRun=${options.dryRun} force=${options.force}`
    );

    for (let index = 0; index < docs.length; index++) {
        const doc = docs[index];
        const entryNum = index + 1;

        try {
            const result = await embedDocument(doc, options);

            if (result.status === 'success') {
                summary.success += 1;
                logEntry(entryNum, total, 'ok', formatDocLabel(doc), ansi.green);
            } else if (result.status === 'dry-run') {
                summary.dryRun += 1;
                logEntry(
                    entryNum,
                    total,
                    'dry-run',
                    `${formatDocLabel(doc)} ${ansi.dim}${doc.discussionLink}${ansi.reset}`,
                    ansi.blue
                );
            } else {
                summary.skipped += 1;
                logEntry(entryNum, total, 'skip', `${formatDocLabel(doc)} (${result.reason})`, ansi.yellow);
            }
        } catch (error) {
            summary.failed += 1;
            logEntry(
                entryNum,
                total,
                'fail',
                `${formatDocLabel(doc)} ${ansi.dim}${doc.discussionLink}${ansi.reset} (${error.message})`,
                ansi.red
            );
        }
    }

    logSummary(summary);
    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error(`${ansi.red}${timestamp()} fatal ${error.message}${ansi.reset}`);
    await mongoose.disconnect();
    process.exit(1);
});
