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
        case 'natUserReport':
            url += `${config.natReportWebhook.id}/${config.natReportWebhook.token}`;
            break;
        case 'contentCase':
            url += `${config.contentCasesWebhook.id}/${config.contentCasesWebhook.token}`;
            break;
        case 'internalContentCase':
            url += `${config.internalContentCasesWebhook.id}/${config.internalContentCasesWebhook.token}`;
            break;
        case 'dev':
            url += `${config.devWebhook.id}/${config.devWebhook.token}`;
            break;
        case 'announcement':
            url += `${config.announcementWebhook.id}/${config.announcementWebhook.token}`;
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

async function userHighlightWebhookPost(webhook, discordIds, text) {
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

    if (!text) text = '';

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

async function roleHighlightWebhookPost(webhook, roles, text) {
    let url = 'https://discordapp.com/api/webhooks/';
    let content = '';

    switch (webhook) {
        case 'contentCase':
            url += `${config.contentCasesWebhook.id}/${config.contentCasesWebhook.token}`;
            break;
        case 'announcement':
            url += `${config.announcementWebhook.id}/${config.announcementWebhook.token}`;
            break;
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

    for (const role of roles) {
        switch (role) {
            case 'gmt':
                content += `<@&${config.announcementWebhook.gmtRole}>`;
                break;
            case 'nat':
                content += `<@&${config.announcementWebhook.natRole}>`;
                break;
            case 'natOsu':
                content += `<@&${config.announcementWebhook.natOsu}>`;
                break;
            case 'natTaiko':
                content += `<@&${config.announcementWebhook.natTaiko}>`;
                break;
            case 'natCatch':
                content += `<@&${config.announcementWebhook.natCatch}>`;
                break;
            case 'natMania':
                content += `<@&${config.announcementWebhook.natMania}>`;
                break;
            case 'bn':
                content += `<@&${config.announcementWebhook.bnRole}>`;
                break;
            case 'bnOsu':
                content += `<@&${config.announcementWebhook.bnOsu}>`;
                break;
            case 'bnTaiko':
                content += `<@&${config.announcementWebhook.bnTaiko}>`;
                break;
            case 'bnCatch':
                content += `<@&${config.announcementWebhook.bnCatch}>`;
                break;
            case 'bnMania':
                content += `<@&${config.announcementWebhook.bnMania}>`;
                break;
            case 'probation':
                content += `<@&${config.announcementWebhook.probationRole}>`;
                break;
            case 'probationOsu':
                content += `<@&${config.announcementWebhook.probationOsu}>`;
                break;
            case 'probationTaiko':
                content += `<@&${config.announcementWebhook.probationTaiko}>`;
                break;
            case 'probationCatch':
                content += `<@&${config.announcementWebhook.probationCatch}>`;
                break;
            case 'probationMania':
                content += `<@&${config.announcementWebhook.probationMania}>`;
                break;
        }
    }

    if (text) content += ` ${text}`;

    try {
        await axios.post(url, {
            content,
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
    lightRed: 16742771,       // active: moveToGroupDiscussion, almostOverdueNotifications
    darkRed: 8787477,         // report
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

    lightBlue: 8643583,       // setConsensus, announcement
    darkBlue: 1911891,        // setCooldown
    blue: 6786559,            // setFeedback

    lightPurple: 11173873,    // submitVetoMediation
    darkPurple: 4263999,      // submitVeto
    purple: 8536232,          // startVetoMediation, concludeVetoMediation

    pink: 16728232,       // revealedCurrentBnEvalNotification, modified report
    white: 15724527,      // unarchive, addEvaluation, sendMessages
    brown: 7554849,       // submitUserNote
    gray: 8815494,        // passive: moveToGroupDiscussion, dev
    black: 2564903,       // archive, deleteVeto
};

async function contentCaseWebhookPost(d) {
    const agree = d.mediations.filter(m => m.vote == 1);
    const disagree = d.mediations.filter(m => m.vote == 3);

    const gmtNatAgree = agree.filter(m => (m.mediator.groups.includes('nat') || m.mediator.groups.includes('gmt')));
    const gmtNatDisagree = disagree.filter(m => (m.mediator.groups.includes('nat') || m.mediator.groups.includes('gmt')));

    const bnAgree = agree.filter(m => m.mediator.groups.includes('bn'));
    const bnDisagree = disagree.filter(m => m.mediator.groups.includes('bn'));

    const totalGmtNatVotes = gmtNatAgree.length + gmtNatDisagree.length;
    const gmtNatAgreePercentage = Math.round((gmtNatAgree.length / totalGmtNatVotes) * 1000) / 10;
    const gmtNatDisagreePercentage = Math.round((gmtNatDisagree.length / totalGmtNatVotes) * 1000) / 10;

    const totalBnVotes = bnAgree.length + bnDisagree.length;
    const bnAgreePercentage = Math.round((bnAgree.length / totalBnVotes) * 1000) / 10;
    const bnDisagreePercentage = Math.round((bnDisagree.length / totalBnVotes) * 1000) / 10;

    const totalVotes = agree.length + disagree.length;
    const totalAgreePercentage = Math.round((agree.length / totalVotes) * 1000) / 10;
    const totalDisagreePercentage = Math.round((disagree.length / totalVotes) * 1000) / 10;

    const description = `Concluded vote for [**${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})\n\nIs this content appropriate for a beatmap? ${d.discussionLink}\n\n**GMT/NAT:** ${gmtNatAgreePercentage}% yes | ${gmtNatDisagreePercentage}% no\n**BN:** ${bnAgreePercentage}% yes | ${bnDisagreePercentage}% no\n**Total:** ${totalAgreePercentage}% yes | ${totalDisagreePercentage}% no`;

    // #content-cases
    await webhookPost(
        [{
            color: webhookColors.darkYellow,
            description,
        }],
        'contentCase'
    );

    // #gmt
    await webhookPost(
        [{
            color: webhookColors.darkYellow,
            description,
        }],
        'internalContentCase'
    );

    const messages = [
        `The content you submitted has been reviewed by the BN/NAT! - ${d.discussionLink}`,
        `Based on vote results below, the content ${gmtNatAgreePercentage >= 70 || totalAgreePercentage >= 70 ? `*CAN*` : `*CANNOT*`} be used. See https://osu.ppy.sh/wiki/en/Rules/Content_Voting_Process for details.`,
        `The vote details are listed below:`,
        `- GMT/NAT: ${gmtNatAgreePercentage}% yes | ${gmtNatDisagreePercentage}% no`,
        `- BN: ${bnAgreePercentage}% yes | ${bnDisagreePercentage}% no`,
        `- Total: ${totalAgreePercentage}% yes | ${totalDisagreePercentage}% no`,
    ];

    return messages;
}

async function announcementWebhookPost(session, title, description) {
    await webhookPost(
        [{
            color: webhookColors.lightBlue,
            title,
            description,
            author: defaultWebhookAuthor(session),
        }],
        'announcement'
    );

    return { success: 'ok' };
}

module.exports = {
    webhookPost,
    highlightWebhookPost,
    userHighlightWebhookPost,
    roleHighlightWebhookPost,
    defaultWebhookAuthor,
    contentCaseWebhookPost,
    announcementWebhookPost,
    webhookColors,
};
