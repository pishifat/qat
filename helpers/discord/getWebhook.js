const webhookConfig = require('../webhookConfig.js');

const BASE = 'https://discordapp.com/api/webhooks/';

/**
 * @param {unknown} entry
 * @returns {string | { error: string }}
 */
function pathPart(entry) {
    if (!entry || typeof entry !== 'object' || !entry.id || !entry.token) {
        return { error: 'webhook not configured' };
    }

    return `${entry.id}/${entry.token}`;
}

/**
 * @param {string} url
 * @param {unknown} entry
 */
function appendPath(url, entry) {
    const part = pathPart(entry);

    if (typeof part === 'object') return part;

    return url + part;
}

/**
 * @param {string} url
 * @param {unknown} entry
 */
function appendPathWithOptionalThread(url, entry) {
    const part = pathPart(entry);

    if (typeof part === 'object') return part;

    let out = url + part;
    // @ts-ignore threadId optional on forum/thread webhooks
    if (entry.threadId) out += `?thread_id=${entry.threadId}`;

    return out;
}

/**
 * @param {string} webhook
 * @returns {Promise<string | { error: string }>}
 */
async function getWebhook(webhook) {
    await webhookConfig.reload();
    const config = webhookConfig.get();

    let url = BASE;

    switch (webhook) {
        case 'osu':
            return appendPath(url, config.standardWebhook);

        case 'taiko':
            return appendPath(url, config.taikoWebhook);

        case 'catch':
            return appendPath(url, config.catchWebhook);

        case 'mania':
            return appendPath(url, config.maniaWebhook);

        case 'all':
            return appendPath(url, config.allWebhook);

        case 'standardQualityAssurance':
            return appendPath(url, config.standardQualityAssuranceWebhook);

        case 'taikoCatchManiaQualityAssurance':
            return appendPath(url, config.taikoCatchManiaQualityAssuranceWebhook);

        case 'publicVetoes':
            return appendPath(url, config.publicVetoesWebhook);

        case 'beatmapReport':
            return appendPath(url, config.beatmapReportWebhook);

        case 'rankedBeatmapReport':
            return appendPathWithOptionalThread(url, config.rankedBeatmapReportWebhook);

        case 'natUserReport':
            return appendPath(url, config.natReportWebhook);

        case 'contentCase':
            return appendPath(url, config.contentCasesWebhook);

        case 'internalContentCase':
            return appendPath(url, config.internalContentCasesWebhook);

        case 'dev':
            return appendPath(url, config.devWebhook);

        case 'announcement':
            return appendPath(url, config.announcementWebhook);

        case 'osuBeatmapReport':
        case 'taikoBeatmapReport':
        case 'catchBeatmapReport':
        case 'maniaBeatmapReport':
            return appendPath(url, config.beatmapReportWebhook);

        case 'securityCheck':
            return appendPathWithOptionalThread(url, config.securityCheckWebhook);

        case 'preferenceModeration':
            return appendPath(url, config.preferenceModerationWebhook);

        default:
            return { error: 'no webhook specified' };
    }
}

module.exports = getWebhook;
