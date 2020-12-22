const { default: axios } = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const moment = require('moment');
const discord = require('./discord');
const osuv1 = require('./osuv1');
const util = require('./util');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Evaluation = require('../models/evaluations/evaluation');
const Veto = require('../models/veto');
const User = require('../models/user');
const QualityAssuranceCheck = require('../models/qualityAssuranceCheck');
const BeatmapReport = require('../models/beatmapReport');
const Aiess = require('../models/aiess');
const Discussion = require('../models/discussion');
const Logger = require('../models/log');

const defaultPopulate = [
    { path: 'user', select: 'username osuId modesInfo' },
    { path: 'natEvaluators', select: 'username osuId discordId' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups discordId',
        },
    },
];

/**
 * @param {Array} reviews
 * @param {Array} natEvaluators
 * @param {Boolean} discussion
 * @returns {Array} discord IDs for relevant NAT
 */
function findNatEvaluatorHighlights (reviews, natEvaluators, discussion) {
    let discordIds = [];

    if (discussion) {
        for (const review of reviews) {
            if (review.evaluator.groups.includes('nat')) {
                discordIds.push(review.evaluator.discordId);
            }
        }
    } else {
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of natEvaluators) {
            if (!evaluatorIds.includes(user.id)) {
                discordIds.push(user.discordId);
            }
        }
    }

    return discordIds;
}

/**
 * @param {Array} reviews
 * @param {Array} natEvaluators
 * @param {Boolean} discussion
 * @returns {string} text for webhook
 */
function findNatEvaluatorStatuses (reviews, natEvaluators, discussion) {
    let text = '';

    if (!discussion) {
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of natEvaluators) {
            if (evaluatorIds.includes(user.id)) {
                text += `\n✅ `;
            } else {
                text += `\n❌ `;
            }

            text += `[${user.username}](https://osu.ppy.sh/users/${user.osuId})`;
        }
    }

    return text;
}

/**
 * @param {Boolean} discussion
 * @param {string} consensus
 * @param {string} feedback
 * @returns {string} text for webhook
 */
function findMissingContent (discussion, consensus, feedback) {
    let text = '\n**Next step:** ';

    if (!discussion) {
        text += `get more NAT evaluations`;
    } else if (!consensus) {
        text += `decide consensus`;
    } else if (!feedback) {
        text += `write feedback`;
    } else {
        text += `send PM`;
    }

    return text;
}

/**
 * @param {Date} deadline
 * @returns {number} text for webhook
 */
function findDaysAgo (deadline) {
    const today = new Date();
    const contacted = new Date(deadline);
    const days = Math.round((today.getTime() - contacted.getTime())/(1000*60*60*24));

    return days;
}

const notifyDeadlines = cron.schedule('0 17 * * *', async () => {
    // establish dates for reference
    const date = new Date();
    const nearDeadline = new Date();
    nearDeadline.setDate(nearDeadline.getDate() + 1);
    const startRange = new Date();
    startRange.setDate(startRange.getDate() + 13);
    const endRange = new Date();
    endRange.setDate(endRange.getDate() + 14);

    // find active events
    let [activeApps, activeRounds, activeVetoes] = await Promise.all([
        AppEvaluation
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate(defaultPopulate),

        Evaluation
            .find({ active: true })
            .populate(defaultPopulate),

        Veto.find({ status: 'wip' }),
    ]);

    // find and post webhook for vetoes
    for (let i = 0; i < activeVetoes.length; i++) {
        const veto = activeVetoes[i];
        let description = `Veto mediation for [**${veto.beatmapTitle}**](http://bn.mappersguild.com/vetoes?id=${veto.id}) `;

        if (date > veto.deadline) {
            description += 'is overdue!';
        } else if (veto.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
        }

        if (date > veto.deadline || veto.deadline < nearDeadline) {
            await discord.webhookPost(
                [{
                    description,
                    color: discord.webhookColors.red,
                }],
                veto.mode
            );
            await util.sleep(500);
        }
    }

    // find and post webhook for BN applications
    for (let i = 0; i < activeApps.length; i++) {
        const app = activeApps[i];
        const deadline = app.deadline;

        let description = `[**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id}) `;
        let generateWebhook = true;
        let discordIds = [];
        let color;

        if (date > deadline) {
            discordIds = findNatEvaluatorHighlights(app.reviews, app.natEvaluators, app.discussion);
            const days = findDaysAgo(app.createdAt);

            description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
            color = discord.webhookColors.red;
        } else if (deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
            color = discord.webhookColors.lightRed;
        } else {
            generateWebhook = false;
        }

        if (generateWebhook) {
            description += findNatEvaluatorStatuses(app.reviews, app.natEvaluators, app.discussion);
            description += findMissingContent(app.discussion, app.consensus, app.feedback);

            await discord.webhookPost(
                [{
                    description,
                    color,
                }],
                app.mode
            );
            await util.sleep(500);

            await discord.userHighlightWebhookPost(app.mode, discordIds);
            await util.sleep(500);
        }
    }

    // find and post webhook for current BN evals
    for (let i = 0; i < activeRounds.length; i++) {
        const round = activeRounds[i];

        let description = `[**${round.user.username}**'s ${round.isResignation ? 'resignation' : 'current BN eval'}](http://bn.mappersguild.com/bneval?id=${round.id}) `;
        let natList = '';
        let generateWebhook = true;
        let discordIds = [];
        let color;

        if (date > round.deadline) {
            discordIds = findNatEvaluatorHighlights(round.reviews, round.natEvaluators, round.discussion);
            const days = findDaysAgo(round.deadline);

            description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
            color = discord.webhookColors.red;
        } else if (round.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
            color = discord.webhookColors.lightRed;
        } else if (round.deadline > startRange && round.deadline < endRange) {
            description += 'is due in two weeks!';
            color = discord.webhookColors.pink;

            if (!round.natEvaluators || !round.natEvaluators.length) {
                round.natEvaluators = await User.getAssignedNat(round.mode);
                await round.populate(defaultPopulate).execPopulate();
                await round.save();
            }

            natList = round.natEvaluators.map(u => u.username).join(', ');
        } else {
            generateWebhook = false;
        }

        if (generateWebhook && !natList.length) {
            description += findNatEvaluatorStatuses(round.reviews, round.natEvaluators, round.discussion);
            description += findMissingContent(round.discussion, round.consensus, round.feedback);
            await discord.webhookPost(
                [{
                    description,
                    color,
                }],
                round.mode
            );
            await util.sleep(500);

            await discord.userHighlightWebhookPost(round.mode, discordIds);
            await util.sleep(500);
        } else if (generateWebhook && natList.length) {
            await discord.webhookPost(
                [{
                    description,
                    color,
                    fields: [
                        {
                            name: 'Assigned NAT',
                            value: natList,
                        },
                    ],
                }],
                round.mode
            );
            await util.sleep(500);
        }
    }
}, {
    scheduled: false,
});

const closeContentReviews = cron.schedule('0 9 * * *', async () => {
    const oneDayAgo = new Date();
    const threeDaysAgo = new Date();
    const sevenDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeContentReviews = await Discussion
        .find({ isContentReview: true, isActive: true })
        .populate({ path: 'mediations' });

    for (const discussion of activeContentReviews) {
        const sevenDaysOld = discussion.createdAt < sevenDaysAgo;
        const threeDaysOld = discussion.createdAt < threeDaysAgo;
        const inactive = discussion.updatedAt < oneDayAgo;

        console.log(sevenDaysOld || (threeDaysOld && inactive));

        if (sevenDaysOld || (threeDaysOld && inactive)) {
            await Discussion.findByIdAndUpdate(discussion.id, { isActive: false });

            Logger.generate(
                null,
                'Concluded vote for a discussion',
                'discussionVote',
                discussion._id
            );

            const agree = discussion.mediations.filter(m => m.vote == 1);
            const disagree = discussion.mediations.filter(m => m.vote == 3);

            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkYellow,
                    description: `Concluded vote for [discussion on **${discussion.title}**](http://bn.mappersguild.com/discussionvote?id=${discussion.id})\n\nIs this content appropriate for a beatmap? ${discussion.discussionLink}\n**Yes:** ${agree.length}\n**No:** ${disagree.length}`,
                }],
                'contentCase'
            );
        }
    }
}, {
    scheduled: false,
});

const notifyBeatmapReports = cron.schedule('0 * * * *', async () => {
    // find pending discussion posts
    let url = 'https://osu.ppy.sh/beatmapsets/discussions?user=&beatmapset_status=qualified&limit=50&message_types%5B%5D=suggestion&message_types%5B%5D=problem&only_unresolved=on';
    const historyHtml = await axios.get(url);
    const $ = cheerio.load(historyHtml.data);
    let discussions = JSON.parse($('#json-discussions').html());

    // find database's discussion posts
    const date = new Date();
    date.setDate(date.getDate() - 10); // used to be 7, but backlog in qualified maps feed caused duplicate reports
    let beatmapReports = await BeatmapReport.find({ createdAt: { $gte: date } });

    // create array of reported beatmapsetIds
    let beatmapsetIds = [];
    beatmapReports.forEach(beatmapReport => {
        if (!beatmapsetIds.includes(beatmapReport.beatmapsetId)) {
            beatmapsetIds.push(beatmapReport.beatmapsetId);
        }
    });

    for (const discussion of discussions) {
        // get discussion url, parsing all discussions and fiding the discussion thread.
        const discussionUrl = `https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion`;
        const discussionHtml = await axios.get(discussionUrl);
        const $discussions = cheerio.load(discussionHtml.data);
        const allDiscussions = JSON.parse($discussions('#json-beatmapset-discussion').html()).beatmapset.discussions;
        const discussionPost = allDiscussions.find(d => d && d.id == discussion.id);

        // variables for easier reading + editing
        let messageType = discussion.message_type;
        let discussionMessage = discussion.starting_post.message;
        let userId = discussion.starting_post.user_id;

        // find last reopen if it exists
        let allPosts = discussionPost.posts;
        allPosts.reverse();
        const lastReopen = allPosts.find(p => p && p.system && !p.message.value);

        // replace discussion details with reopen
        if (lastReopen) {
            let reopenPost = allPosts[allPosts.indexOf(lastReopen) + 1];
            messageType = `reopen ${discussion.message_type}`;
            discussionMessage = reopenPost.message;
            userId = lastReopen.user_id;
        }

        // determine which posts haven't been sent to #report-feed
        let createWebhook;

        if (!beatmapsetIds.includes(discussion.beatmapset_id)) {
            createWebhook = true;
        } else {
            let alreadyReported = await BeatmapReport.findOne({
                createdAt: { $gte: date },
                beatmapsetId: discussion.beatmapset_id,
                reporterUserId: userId,
            });

            if (!alreadyReported) {
                createWebhook = true;
            }
        }

        if (createWebhook) {
            // don't let the same map repeat in hourly cycle
            beatmapsetIds.push(discussion.beatmapset_id);

            // create event in db
            await BeatmapReport.create({
                beatmapsetId: discussion.beatmapset_id,
                postId: discussion.id,
                reporterUserId: userId,
            });

            // get user data
            const userInfo = await osuv1.getUserInfoV1(userId);
            await util.sleep(500);

            const mongoUser = await User.findOne({ osuId: userId });

            // identify modes
            let modes = [];

            if (discussion.beatmap) {
                if (discussion.beatmap.mode == 'fruits') modes.push('catch');
                else modes.push(discussion.beatmap.mode);

            } else {
                let beatmapsetInfo = await osuv1.beatmapsetInfo(discussion.beatmapset_id, true);
                beatmapsetInfo.forEach(beatmap => {
                    switch (beatmap.mode) {
                        case '0':
                            if (!modes.includes('osu')) modes.push('osu');
                            break;
                        case '1':
                            if (!modes.includes('taiko')) modes.push('taiko');
                            break;
                        case '2':
                            if (!modes.includes('catch')) modes.push('catch');
                            break;
                        case '3':
                            if (!modes.includes('mania')) modes.push('mania');
                            break;
                    }
                });
            }

            // send webhook
            await discord.webhookPost(
                [{
                    author: {
                        name: userInfo.username,
                        icon_url: `https://a.ppy.sh/${userId}`,
                        url: `https://osu.ppy.sh/users/${userId}`,
                    },
                    description: `[**${discussion.beatmapset.artist} - ${discussion.beatmapset.title}**](https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion/-/generalAll#/${discussion.id})\nMapped by [${discussion.beatmapset.creator}](https://osu.ppy.sh/users/${discussion.beatmapset.user_id}) [**${modes.join(', ')}**]`,
                    thumbnail: {
                        url: `https://b.ppy.sh/thumb/${discussion.beatmapset_id}.jpg`,
                    },
                    color: messageType.includes('problem') ? discord.webhookColors.red : mongoUser && mongoUser.isBnOrNat ? discord.webhookColors.orange : discord.webhookColors.lightOrange,
                    fields: [
                        {
                            name: messageType,
                            value: discussionMessage.length > 500 ? discussionMessage.slice(0,500) + '... *(truncated)*' : discussionMessage,
                        },
                    ],
                }],
                'beatmapReport'
            );
            await util.sleep(500);

            // send highlights
            if (messageType.includes('problem') || (mongoUser && mongoUser.isBnOrNat)) {
                modes.forEach(mode => {
                    discord.highlightWebhookPost('', `${mode}BeatmapReport`);
                });
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * Notify of quality assurance helper activity every saturday at 22 pm
 */
const notifyQualityAssurance = cron.schedule('0 22 * * 6', async () => {
    let sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await User
        .find({
            $or: [
                { groups: 'nat' },
                { groups: 'bn' },
            ],
        })
        .sort({ username: 1 });

    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (const mode of modes) {
        for (let i = 0; i < users.length; i++) {
            const userId = users[i].id;

            const recent = await QualityAssuranceCheck.find({ user: userId, timestamp: { $gte: sevenDaysAgo }, mode });
            const all = await QualityAssuranceCheck.find({ user: userId, mode });

            users[i].recentQaChecks = recent.length;
            users[i].allQaChecks = all.length;
        }

        const overallUsers = [...users];
        const recentUsers = [...users];

        overallUsers.sort((a, b) => {
            if (a.allQaChecks > b.allQaChecks) return -1;
            if (a.allQaChecks < b.allQaChecks) return 1;

            return 0;
        });

        recentUsers.sort((a, b) => {
            if (a.recentQaChecks > b.recentQaChecks) return -1;
            if (a.recentQaChecks < b.recentQaChecks) return 1;

            return 0;
        });


        let topTenText = '';
        let topTenCount = 0;

        for (let i = 0; topTenCount < 10 && i < users.length; i++) {
            const user = overallUsers[i];

            if (user.isBnFor(mode) && user.allQaChecks > 0) {
                topTenCount++;
                topTenText += `${topTenCount}. ${user.username}: **${user.allQaChecks}**\n`;
            }
        }

        let recentText = '';
        let recentCount = 0;

        for (let i = 0; recentCount < 3 && i < users.length; i++) {
            const user = recentUsers[i];

            if (user.isBnFor(mode) && user.recentQaChecks > 0) {
                recentCount++;
                recentText += `${recentCount}. ${user.username}: **${user.recentQaChecks}**\n`;
            }
        }

        await discord.webhookPost(
            [{
                title: `${mode == 'osu' ? 'osu!' : 'osu!' + mode} QA activity`,
                color: discord.webhookColors.lightBlue,
                fields: [{
                    name: `all time`,
                    value: topTenText,
                },{
                    name: `last 7 days`,
                    value: recentText,
                }],
            }],
            mode == 'osu' ? 'standardQualityAssurance' : 'taikoCatchManiaQualityAssurance'
        );
        await util.sleep(500);
    }
}, {
    scheduled: false,
});

/**
 * Checks for bns with less than 6 mods (4 for mania) the first day of every month
 */
const lowActivityTask = cron.schedule('0 23 1 * *', async () => {
    const lowActivityFields = [];
    const initialDate = moment().subtract(3, 'months').toDate();

    const bns = await User.find({ groups: 'bn' });

    for (const bn of bns) {
        const joinedHistory = bn.history.filter(h => h.kind === 'joined');
        const date = joinedHistory[joinedHistory.length - 1].date;

        if (new Date(date) < initialDate) {
            for (const mode of bn.modes) {
                if (await hasLowActivity(initialDate, bn, mode)) {
                    lowActivityFields.push({
                        name: bn.username,
                        value: `${await findUniqueNominations(initialDate, bn)}`,
                        inline: true,
                        mode,
                    });
                }
            }
        }
    }

    if (!lowActivityFields.length) return;

    let formatField = { name: 'username', value: 'nominations within 3 months' };
    let osuFields = [];
    let taikoFields = [];
    let catchFields = [];
    let maniaFields = [];
    osuFields.push(formatField);
    taikoFields.push(formatField);
    catchFields.push(formatField);
    maniaFields.push(formatField);

    lowActivityFields.forEach(field => {
        switch (field.mode) {
            case 'osu':
                osuFields.push(field);
                break;
            case 'taiko':
                taikoFields.push(field);
                break;
            case 'catch':
                catchFields.push(field);
                break;
            case 'mania':
                maniaFields.push(field);
                break;
        }
    });

    const modeFields = [osuFields, taikoFields, catchFields, maniaFields];
    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (let i = 0; i < modeFields.length; i++) {
        const modeField = modeFields[i];

        if (modeField.length > 1) { // only create webhook if there are users with low activity in mode
            await discord.webhookPost(
                [{
                    title: 'Low Activity',
                    description: `The following users have low activity from ${initialDate.toISOString().slice(0,10)} to today`,
                    color: discord.webhookColors.red,
                    fields: modeField,
                }],
                modes[i]
            );
        }

        await util.sleep(500);
    }
}, {
    scheduled: false,
});

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @returns {Promise<number>} number of unique bubbled/qualified
 */
async function findUniqueNominations (initialDate, bn) {
    const events = await Aiess.distinct('beatmapsetId', {
        userId: bn.osuId,
        type: {
            $in: ['nominate', 'qualify'],
        },
        timestamp: {
            $gt: initialDate,
        },
    });

    return events.length;
}

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @returns {Promise<number>} number of qa checks
 */
async function findQualityAssuranceChecks (initialDate, bn) {
    const events = await QualityAssuranceCheck.find({
        user: bn.id,
        timestamp: { $gt: initialDate },
    });

    return events.length;
}

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @param {string} mode
 * @returns {Promise<boolean>} whether or not the user has 'low activity'
 */
async function hasLowActivity (initialDate, bn, mode) {
    const [uniqueNominations, qualityAssuranceChecks] = await Promise.all([
        findUniqueNominations(initialDate, bn),
        findQualityAssuranceChecks(initialDate, bn),
    ]);

    if (
        (uniqueNominations + (qualityAssuranceChecks / 4) < 4 && mode == 'mania') ||
        (uniqueNominations + (qualityAssuranceChecks / 4) < 6 && mode != 'mania')
    ) {
        return true;
    }

    return false;
}

module.exports = { notifyDeadlines, notifyBeatmapReports, lowActivityTask, notifyQualityAssurance, closeContentReviews };
