const webhookConfig = require('../webhookConfig.js');
let config = webhookConfig.get();

function getRoles(roles) {
    webhookConfig.reload();
    config = webhookConfig.get();
    
    let pings = '';

    for (const role of roles) {
        switch (role) {
            case 'gmt':
                pings += `<@&${config.announcementWebhook.gmtRole}> `;
                break;
            case 'contentReview':
                pings += `<@&${config.announcementWebhook.contentReviewRole}> `;
                break;
            case 'natInternal':
                pings += `<@&${config.announcementWebhook.natInternalRole}> `;
                break;
            case 'nat':
                pings += `<@&${config.announcementWebhook.natRole}> `;
                break;
            case 'natOsu':
                pings += `<@&${config.announcementWebhook.natOsu}> `;
                break;
            case 'natTaiko':
                pings += `<@&${config.announcementWebhook.natTaiko}> `;
                break;
            case 'natCatch':
                pings += `<@&${config.announcementWebhook.natCatch}> `;
                break;
            case 'natMania':
                pings += `<@&${config.announcementWebhook.natMania}> `;
                break;
            case 'natEvaluatorOsu':
                pings += `<@&${config.announcementWebhook.natEvaluatorOsu}> `;
                break;
            case 'natEvaluatorTaiko':
                pings += `<@&${config.announcementWebhook.natEvaluatorTaiko}> `;
                break;
            case 'natEvaluatorCatch':
                pings += `<@&${config.announcementWebhook.natEvaluatorCatch}> `;
                break;
            case 'natEvaluatorMania':
                pings += `<@&${config.announcementWebhook.natEvaluatorMania}> `;
                break;
            case 'bn':
                pings += `<@&${config.announcementWebhook.bnRole}> `;
                break;
            case 'bnOsu':
                pings += `<@&${config.announcementWebhook.bnOsu}> `;
                break;
            case 'bnTaiko':
                pings += `<@&${config.announcementWebhook.bnTaiko}> `;
                break;
            case 'bnCatch':
                pings += `<@&${config.announcementWebhook.bnCatch}> `;
                break;
            case 'bnMania':
                pings += `<@&${config.announcementWebhook.bnMania}> `;
                break;
            case 'probation':
                pings += `<@&${config.announcementWebhook.probationRole}> `;
                break;
            case 'probationOsu':
                pings += `<@&${config.announcementWebhook.probationOsu}> `;
                break;
            case 'probationTaiko':
                pings += `<@&${config.announcementWebhook.probationTaiko}> `;
                break;
            case 'probationCatch':
                pings += `<@&${config.announcementWebhook.probationCatch}> `;
                break;
            case 'probationMania':
                pings += `<@&${config.announcementWebhook.probationMania}> `;
                break;
            case 'groupMovers':
                pings += `<@&${config.announcementWebhook.groupMoversRole}> `;
                break;
            case 'osuBeatmapReport':
                pings += `<@&${config.beatmapReportWebhook.osuRole}> `;
                break;
            case 'taikoBeatmapReport':
                pings += `<@&${config.beatmapReportWebhook.taikoRole}> `;
                break;
            case 'catchBeatmapReport':
                pings += `<@&${config.beatmapReportWebhook.catchRole}> `;
                break;
            case 'maniaBeatmapReport':
                pings += `<@&${config.beatmapReportWebhook.maniaRole}> `;
                break;
            case 'securityCheck':
                pings += `<@&${config.securityCheckWebhook.role}> `;
                break;
        }
    }
    
    return pings.trim();
}

module.exports = getRoles;
