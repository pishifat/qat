const { default: axios } = require('axios');
const getWebhook = require('./discord/getWebhook');
const getRoles = require('./discord/getRoles');
const webhookColors = require('./discord/webhookColors');
const util = require('./util');

const username = 'bnsite';
const avatar_url = 'https://raw.githubusercontent.com/pishifat/qat/refs/heads/master/public/images/qatlogo.png';

/**
 * internal: posts embed error to dev webhook on failure.
 */
async function errorWebhookPost(error, message, webhook) {
    const url = getWebhook('dev');
    if (typeof url === 'object') return url;

    const fields = [
        {
            name: 'webhook',
            value: `\`${webhook}\``,
        },
        {
            name: 'message',
            value: util.shorten(`\`\`\`${message instanceof Object ? JSON.stringify(message, null, 2) : message}\`\`\``, 1024),
        },
    ];

    const embed = [{
        author: {
            name: username,
            icon_url: avatar_url,
        },
        color: webhookColors.red,
        title: '❌ Embed error',
        description:
            '```' +
            util.shorten(error.stack, 2000) +
            '```',
        fields,
        timestamp: new Date(),
    }];

    try {
        await axios.post(url, {
            username,
            avatar_url,
            embeds: embed,
        });
    } catch (error) {
        // ¯\_(ツ)_/¯
    }
}

/**
 * posts embeds to the given webhook by name.
 * @param {Array} message - discord embed objects
 * @param {string} webhook - webhook key (e.g. 'publicVetoes', 'announcement')
 */
async function webhookPost(message, webhook) {
    let url = getWebhook(webhook);
    if (typeof url === 'object') return url;

    try {
        await axios.post(url, {
            username,
            avatar_url,
            embeds: message,
        });
    } catch (error) {
        await errorWebhookPost(error, message, webhook);
    }
}

/**
 * posts embeds with a role ping; uses webhook name as the role key in getRoles.
 * @param {string} message - optional text before/after embed
 * @param {Array} embeds - discord embed objects
 * @param {string} webhook - webhook key (also used to resolve role)
 */
async function highlightWebhookPost(message, embeds, webhook) {
    const url = getWebhook(webhook);
    const role = getRoles([webhook]);
    if (typeof url === 'object') return url;

    try {
        await axios.post(url, {
            username,
            avatar_url,
            embeds,
            content: role + ' ' + message,
        });
    } catch (error) {
        await errorWebhookPost(error, message, webhook);
    }
}

/**
 * posts content pinging the given discord user ids (optional text appended).
 * @param {string} webhook - webhook key
 * @param {Array<string>} discordIds - discord user ids to mention
 * @param {string} [text] - optional message after pings
 */
async function userHighlightWebhookPost(webhook, discordIds, text) {
    const url = getWebhook(webhook);
    if (typeof url === 'object') return url;

    if (!text) text = '';

    for (const id of discordIds) {
        text += `<@${id}> `;
    }

    try {
        await axios.post(url, {
            username,
            avatar_url,
            content: text,
        });
    } catch (error) {
        await errorWebhookPost(error, text, webhook);
    }
}

/**
 * posts content pinging the given role keys, with optional text and embeds.
 * @param {string} webhook - webhook key
 * @param {Array<string>} roles - role keys for getRoles (e.g. 'osuVeto', 'natInternal')
 * @param {string} [text] - optional message after pings
 * @param {Array} [embeds] - optional discord embed objects
 */
async function roleHighlightWebhookPost(webhook, roles, text, embeds) {
    const url = getWebhook(webhook);
    let content = getRoles(roles);
    if (typeof url === 'object') return url;

    if (text) content += ` ${text}`;

    try {
        await axios.post(url, {
            username,
            avatar_url,
            content,
            embeds,
        });
    } catch (error) {
        await errorWebhookPost(error, content, webhook);
    }
}

/**
 * returns default author object for webhook embeds (username, avatar, profile link).
 */
function defaultWebhookAuthor(session) {
    return {
        name: session.username,
        icon_url: `https://a.ppy.sh/${session.osuId}`,
        url: `https://osu.ppy.sh/users/${session.osuId}`,
    };
}

/**
 * posts discussion vote result to the all webhook.
 * @param {Object} d - discussion document with mediations
 * @param {Object} session - user session for author
 */
async function discussionWebhookPost(d, session) {
    const agree = d.mediations.filter(m => m.vote == 1);
    const neutral = d.mediations.filter(m => m.vote == 2);
    const disagree = d.mediations.filter(m => m.vote == 3);

    const natAgree = agree.filter(m => (m.mediator.groups.includes('nat') || m.mediator.groups.includes('gmt')));
    const natNeutral = neutral.filter(m => (m.mediator.groups.includes('nat') || m.mediator.groups.includes('gmt')));
    const natDisagree = disagree.filter(m => (m.mediator.groups.includes('nat') || m.mediator.groups.includes('gmt')));

    const bnAgree = agree.filter(m => m.mediator.groups.includes('bn'));
    const bnNeutral = neutral.filter(m => m.mediator.groups.includes('bn'));
    const bnDisagree = disagree.filter(m => m.mediator.groups.includes('bn'));

    const totalNatVotes = natAgree.length + natNeutral.length + natDisagree.length;
    const natAgreePercentage = Math.round((natAgree.length / totalNatVotes) * 1000) / 10;
    const natNeutralPercentage = Math.round((natNeutral.length / totalNatVotes) * 1000) / 10;
    const natDisagreePercentage = Math.round((natDisagree.length / totalNatVotes) * 1000) / 10;

    const totalBnVotes = bnAgree.length + bnNeutral.length + bnDisagree.length;
    const bnAgreePercentage = Math.round((bnAgree.length / totalBnVotes) * 1000) / 10;
    const bnNeutralPercentage = Math.round((bnNeutral.length / totalBnVotes) * 1000) / 10;
    const bnDisagreePercentage = Math.round((bnDisagree.length / totalBnVotes) * 1000) / 10;

    const totalVotes = agree.length + neutral.length + disagree.length;
    const totalAgreePercentage = Math.round((agree.length / totalVotes) * 1000) / 10;
    const totalNeutralPercentage = Math.round((neutral.length / totalVotes) * 1000) / 10;
    const totalDisagreePercentage = Math.round((disagree.length / totalVotes) * 1000) / 10;

    let description = `Concluded vote for [discussion on **${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})`;
    description += '\n\n';

    // agree
    description += `- **${d.agreeOverwriteText ? d.agreeOverwriteText : 'Yes/Agree'}:**`;

    if (totalBnVotes) {
        description += '\n';
        description += `  - **NAT:** ${natAgreePercentage}% (${natAgree.length}/${totalNatVotes})\n`;
        description += `  - **BN:** ${bnAgreePercentage}% (${bnAgree.length}/${totalBnVotes})\n`;
        description += `  - **Total:** ${totalAgreePercentage}% (${agree.length}/${totalVotes})\n`;
    } else {
        description += ` ${totalAgreePercentage}% (${agree.length}/${totalVotes})\n`;
    }

    // neutral (if allowed)
    if (d.neutralAllowed) {
        description += `- **${d.neutralOverwriteText ? d.neutralOverwriteText : 'Neutral'}:**`;

        if (totalBnVotes) {
            description += '\n';
            description += `  - **NAT:** ${natNeutralPercentage}% (${natNeutral.length}/${totalNatVotes})\n`;
            description += `  - **BN:** ${bnNeutralPercentage}% (${bnNeutral.length}/${totalBnVotes})\n`;
            description += `  - **Total:** ${totalNeutralPercentage}% (${neutral.length}/${totalVotes})\n`;
        } else {
            description += ` ${totalNeutralPercentage}% (${neutral.length}/${totalVotes})\n`;
        }
    }

    // disagree
    description += `- **${d.disagreeOverwriteText ? d.disagreeOverwriteText : 'No/Disagree'}:**`;

    if (totalBnVotes) {
        description += '\n';
        description += `  - **NAT:** ${natDisagreePercentage}% (${natDisagree.length}/${totalNatVotes})\n`;
        description += `  - **BN:** ${bnDisagreePercentage}% (${bnDisagree.length}/${totalBnVotes})\n`;
        description += `  - **Total:** ${totalDisagreePercentage}% (${disagree.length}/${totalVotes})\n`;
    } else {
        description += ` ${totalDisagreePercentage}% (${disagree.length}/${totalVotes})\n`;
    }

    await webhookPost(
        [{
            author: defaultWebhookAuthor(session),
            color: webhookColors.darkYellow,
            description,
        }],
        //discussion.mode -- disabling this because of trial nat
        'all'
    );
}

/**
 * posts content case vote result to content-case and internal webhooks; saves consensus, returns message and channel for email.
 * @param {Object} d - discussion document with mediations
 * @returns {{ message: string, channel: Object }}
 */
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

    const description = `Concluded vote for [**${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})\n\nIs this content appropriate for a beatmap? ${d.discussionLink}\n\n- **GMT/NAT:** ${gmtNatAgreePercentage}% yes | ${gmtNatDisagreePercentage}% no\n- **BN:** ${bnAgreePercentage}% yes | ${bnDisagreePercentage}% no\n- **Total:** ${totalAgreePercentage}% yes | ${totalDisagreePercentage}% no\n\nConsensus: ${gmtNatAgreePercentage >= 70 || totalAgreePercentage >= 70 ? `**Pass**` : `**Fail**`}`;

    // #content-cases (BN server)
    await webhookPost(
        [{
            color: webhookColors.darkYellow,
            description,
        }],
        'contentCase'
    );

    // #content-review (internal)
    await webhookPost(
        [{
            color: webhookColors.darkYellow,
            description,
        }],
        'internalContentCase'
    );

    // save consensus
    d.isAcceptable = gmtNatAgreePercentage >= 70 || totalAgreePercentage >= 70;
    await d.save();

    const channel = {
        name: 'Content Review Results',
        description: 'Results for your recent content review submission',
    };

    let message = `The content you submitted has been reviewed by the BN/NAT! - ${d.discussionLink}`;
    message += `\n\n`;
    message += `Based on vote results below, the content ${gmtNatAgreePercentage >= 70 || totalAgreePercentage >= 70 ? `**CAN**` : `**CANNOT**`} be used. See [this page](https://osu.ppy.sh/wiki/en/Rules/Content_Voting_Process) for details.`;
    message += `\n\n`;
    message += `The vote details are listed below:`;
    message += `\n\n`;
    message += `- GMT/NAT: ${gmtNatAgreePercentage}% yes | ${gmtNatDisagreePercentage}% no\n`;
    message += `- BN: ${bnAgreePercentage}% yes | ${bnDisagreePercentage}% no\n`;
    message += `- Total: ${totalAgreePercentage}% yes | ${totalDisagreePercentage}% no`;

    return { message, channel };
}

/**
 * posts announcement with title and description to the announcement webhook.
 * @param {Object} session - user session for author
 * @param {string} title - announcement title (prefix added automatically)
 * @param {string} description - markdown body, images linked
 * @returns {{ success: string }}
 */
async function announcementWebhookPost(session, title, description) {
    title = '📢 ' + title;
    const firstImage = description.match(/https?:\/\/.*\.(?:png|jpg|jpeg|gif|png)/i);

    // replace all image links ![](LINK) with [image](LINK)
    description = description.replace(/!\[.*\]\((https?:\/\/.*\.(?:png|jpg|jpeg|gif|png))\)/gi, '[image]($1)');

    await webhookPost(
        [{
            color: webhookColors.lightBlue,
            title,
            description,
            author: defaultWebhookAuthor(session),
            image: firstImage ? { url: firstImage[0] } : undefined,
        }],
        'announcement'
    );

    return { success: 'ok' };
}

/**
 * @param {Array} reviews
 * @param {Array} evaluators
 * @param {Boolean} discussion
 * @returns {Array} discord IDs for relevant NAT
 */
function findEvaluatorHighlights(reviews, evaluators, discussion) {
    let discordIds = [];

    if (evaluators.length == 1) {
        // NAT evaluation: ping the user or NAT leader
        discordIds.push(evaluators[0].discordId);
    } else if (discussion) {
        // group evaluation: ping anyone who evaluated
        for (const review of reviews) {
            if (review.evaluators && review.evaluator.groups.includes('nat') && review.evaluator.isBnEvaluator) {
                discordIds.push(review.evaluator.discordId);
            }
        }
    } else {
        // individual evaluation: ping anyone assigned who hasn't already evaluated
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of evaluators) {
            if (!evaluatorIds.includes(user.id) && user.isBnEvaluator) {
                discordIds.push(user.discordId);
            }
        }
    }

    return discordIds;
}

module.exports = {
    webhookPost,
    highlightWebhookPost,
    userHighlightWebhookPost,
    roleHighlightWebhookPost,
    defaultWebhookAuthor,
    discussionWebhookPost,
    contentCaseWebhookPost,
    announcementWebhookPost,
    webhookColors,
    findEvaluatorHighlights,
};
