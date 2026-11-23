const sharp = require('sharp');
const imageSimilarityService = require('./imageSimilarityService');
const { isDiscussionImageUrl, resolveDiscussionImageUrl } = require('../helpers/discussionImage');

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const DOWNLOAD_TIMEOUT_MS = 60000;

async function downloadImage(url, maxBytes = MAX_BYTES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    const limitMb = Math.round(maxBytes / (1024 * 1024));

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > maxBytes) {
            throw new Error(`Image exceeds ${limitMb}MB`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > maxBytes) {
            throw new Error(`Image exceeds ${limitMb}MB`);
        }

        return buffer;
    } finally {
        clearTimeout(timeout);
    }
}

async function normalizeImage(buffer) {
    const meta = await sharp(buffer).metadata();
    const format = meta.format;

    if (!['jpeg', 'png', 'webp', 'gif'].includes(format)) {
        throw new Error('Unsupported image format');
    }

    return sharp(buffer).rotate().toBuffer();
}

async function fingerprintFromBuffer(buffer) {
    const normalized = await normalizeImage(buffer);
    return imageSimilarityService.computeFingerprint(normalized);
}

async function fingerprintFromUrl(url) {
    const resolvedUrl = resolveDiscussionImageUrl(url) || url;
    const buffer = await downloadImage(resolvedUrl);
    return fingerprintFromBuffer(buffer);
}

async function getFingerprintFields(url) {
    if (!isDiscussionImageUrl(url)) return {};

    try {
        return {
            imageSimilarity: await fingerprintFromUrl(url),
            imageSimilarityMethod: imageSimilarityService.METHOD,
        };
    } catch (error) {
        console.warn(`CR image fingerprint failed for ${url}: ${error.message}`);
        return {};
    }
}

module.exports = {
    MAX_BYTES,
    downloadImage,
    fingerprintFromBuffer,
    fingerprintFromUrl,
    getFingerprintFields,
};
