const webhookConfig = require('../webhookConfig.js');
const config = webhookConfig.get();

function getWebhook(webhook) {
    let url = 'https://discordapp.com/api/webhooks/';

    switch (webhook) {
        case 'osu':
            return url += `${config.standardWebhook.id}/${config.standardWebhook.token}`;

        case 'taiko':
            return url += `${config.taikoWebhook.id}/${config.taikoWebhook.token}`;

        case 'catch':
            return url += `${config.catchWebhook.id}/${config.catchWebhook.token}`;

        case 'mania':
            return url += `${config.maniaWebhook.id}/${config.maniaWebhook.token}`;

        case 'all':
            return url += `${config.allWebhook.id}/${config.allWebhook.token}`;

        case 'standardQualityAssurance':
            return url += `${config.standardQualityAssuranceWebhook.id}/${config.standardQualityAssuranceWebhook.token}`;

        case 'taikoCatchManiaQualityAssurance':
            return url += `${config.taikoCatchManiaQualityAssuranceWebhook.id}/${config.taikoCatchManiaQualityAssuranceWebhook.token}`;

        case 'beatmapReport':
            return url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;

        case 'natUserReport':
            return url += `${config.natReportWebhook.id}/${config.natReportWebhook.token}`;

        case 'contentCase':
            return url += `${config.contentCasesWebhook.id}/${config.contentCasesWebhook.token}`;

        case 'internalContentCase':
            return url += `${config.internalContentCasesWebhook.id}/${config.internalContentCasesWebhook.token}`;

        case 'dev':
            return url += `${config.devWebhook.id}/${config.devWebhook.token}`;

        case 'announcement':
            return url += `${config.announcementWebhook.id}/${config.announcementWebhook.token}`;

        case 'osuBeatmapReport':
        case 'taikoBeatmapReport':
        case 'catchBeatmapReport':
        case 'maniaBeatmapReport':
            return url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;

        default:
            return { error: 'no webhook specified' };
    }
}

module.exports = getWebhook;
