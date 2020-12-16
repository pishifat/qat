const config = require('../config.json');
const { default: axios } = require('axios');

async function webhookPost(message, webhook) {
    let url = 'https://discordapp.com/api/webhooks/';

    switch (webhook) {
        case 'osu':
            url += `${config.standardWebhook.id}/${config.standardWebhook.token}`;
            break;
        case 'taiko':
            url += `${config.taikoWebhook.id}/${config.taikoWebhook.token}`;
            break;
        case 'catch':
            url += `${config.catchWebhook.id}/${config.catchWebhook.token}`;
            break;
        case 'mania':
            url += `${config.maniaWebhook.id}/${config.maniaWebhook.token}`;
            break;
        case 'all':
            url += `${config.allWebhook.id}/${config.allWebhook.token}`;
            break;
        case 'standardQualityAssurance':
            url += `${config.standardQualityAssuranceWebhook.id}/${config.standardQualityAssuranceWebhook.token}`;
            break;
        case 'taikoCatchManiaQualityAssurance':
            url += `${config.taikoCatchManiaQualityAssuranceWebhook.id}/${config.taikoCatchManiaQualityAssuranceWebhook.token}`;
            break;
        case 'beatmapReport':
            url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;
            break;
        case 'userReport':
            url += `${config.reportWebhook.id}/${config.reportWebhook.token}`;
            break;
        case 'natUserReport':
            url += `${config.natReportWebhook.id}/${config.natReportWebhook.token}`;
            break;
        case 'contentCase':
            url += `${config.contentCasesWebhook.id}/${config.contentCasesWebhook.token}`;
            break;
        default:
            return { error: 'no webhook specified' };
    }

    try {
        await axios.post(url, {
            embeds: message,
        });
    } catch (error) {
        //
    }
}

async function highlightWebhookPost(message, webhook) {
    let url = 'https://discordapp.com/api/webhooks/';
    let role;

    switch (webhook) {
        case 'osuBeatmapReport':
            url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;
            role = '<@&' + config.beatmapReportWebhook.osuRole + '>';
            break;
        case 'taikoBeatmapReport':
            url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;
            role = '<@&' + config.beatmapReportWebhook.taikoRole + '>';
            break;
        case 'catchBeatmapReport':
            url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;
            role = '<@&' + config.beatmapReportWebhook.catchRole + '>';
            break;
        case 'maniaBeatmapReport':
            url += `${config.beatmapReportWebhook.id}/${config.beatmapReportWebhook.token}`;
            role = '<@&' + config.beatmapReportWebhook.maniaRole + '>';
            break;
    }

    try {
        await axios.post(url, {
            content: role + ' ' + message,
        });
    } catch (error) {
        //
    }
}

async function userHighlightWebhookPost(webhook, discordIds) {
    let url = 'https://discordapp.com/api/webhooks/';

    switch (webhook) {
        case 'osu':
            url += `${config.standardWebhook.id}/${config.standardWebhook.token}`;
            break;
        case 'taiko':
            url += `${config.taikoWebhook.id}/${config.taikoWebhook.token}`;
            break;
        case 'catch':
            url += `${config.catchWebhook.id}/${config.catchWebhook.token}`;
            break;
        case 'mania':
            url += `${config.maniaWebhook.id}/${config.maniaWebhook.token}`;
            break;
    }

    let text = '';

    for (const id of discordIds) {
        text += `<@${id}> `;
    }

    try {
        await axios.post(url, {
            content: text,
        });
    } catch (error) {
        //
    }
}

async function roleHighlightWebhookPost(webhook, id) {
    let url = 'https://discordapp.com/api/webhooks/';
    let text = '';

    switch (webhook) { // more roles later maybe
        case 'contentCases':
            url += `${config.contentCasesWebhook.id}/${config.contentCasesWebhook.token}`;
            text = `<@&${config.contentCasesWebhook.gmtRole}>`;
            break;
    }

    try {
        await axios.post(url, {
            content: text,
        });
    } catch (error) {
        //
    }
}

function defaultWebhookAuthor(session) {
    return {
        name: session.username,
        icon_url: `https://a.ppy.sh/${session.osuId}`,
        url: `https://osu.ppy.sh/users/${session.osuId}`,
    };
}

const webhookColors = {
    lightRed: 16742771,       // nonUserReport, active: moveToGroupDiscussion, almostOverdueNotifications
    darkRed: 8787477,         // userReport
    red: 15607337,            // overdueNotifications, problemReport, lowActivity

    lightOrange: 15639928,    // enableBnEvaluators, suggestionReport
    darkOrange: 7092736,      // replaceMediator
    orange: 15169835,         // replaceEvaluator

    lightYellow: 16777104,
    darkYellow: 7105536,      // concludeDiscussionVote
    yellow: 16777022,         // submitMediationDiscussionVote

    lightGreen: 8847214,      // submitEval, submitQA
    darkGreen: 1921053,       // switchUserGroup
    green: 4380222,           // newBnApplication

    lightBlue: 8643583,       // setConsensus
    darkBlue: 1911891,        // setCooldown
    blue: 6786559,            // setFeedback

    lightPurple: 11173873,    // submitVetoMediation
    darkPurple: 4263999,      // submitVeto
    purple: 8536232,          // startVetoMediation, concludeVetoMediation

    pink: 16728232,       // revealedCurrentBnEvalNotification
    white: 15724527,      // unarchive, addEvaluation
    brown: 7554849,       // submitUserNote
    gray: 8815494,        // passive: moveToGroupDiscussion,
    black: 2564903,       // archive
};

module.exports = {
    webhookPost,
    highlightWebhookPost,
    userHighlightWebhookPost,
    roleHighlightWebhookPost,
    defaultWebhookAuthor,
    webhookColors,
};
