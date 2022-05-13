const cron = require('node-cron');
const moment = require('moment');
const discord = require('./discord');
const Aiess = require('../models/aiess');
const osuv1 = require('./osuv1');
const osu = require('./osu');
const osuBot = require('./osuBot');
const util = require('./util');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Evaluation = require('../models/evaluations/evaluation');
const Veto = require('../models/veto');
const BnFinderMatch = require('../models/bnFinderMatch');
const User = require('../models/user');
const BeatmapReport = require('../models/beatmapReport');
const Discussion = require('../models/discussion');
const Report = require('../models/report');
const Logger = require('../models/log');

const defaultPopulate = [
    { path: 'user', select: 'username osuId modesInfo' },
    { path: 'natEvaluators', select: 'username osuId discordId isBnEvaluator' },
    { path: 'bnEvaluators', select: 'username osuId discordId isBnEvaluator' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups discordId isBnEvaluator',
        },
    },
];

const defaultReportPopulate = [
    { path: 'culprit', select: 'username osuId modesInfo' },
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
            if (review.evaluator.groups.includes('nat') && review.evaluator.isBnEvaluator) {
                discordIds.push(review.evaluator.discordId);
            }
        }
    } else {
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of natEvaluators) {
            if (!evaluatorIds.includes(user.id) && user.isBnEvaluator) {
                discordIds.push(user.discordId);
            }
        }
    }

    return discordIds;
}

/**
 * @param {Array} reviews
 * @param {Array} evaluators
 * @param {Boolean} discussion
 * @returns {string} text for webhook
 */
function findNatEvaluatorStatuses (reviews, evaluators, discussion) {
    let text = '';

    if (!discussion) {
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of evaluators) {
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
        text += `get more evaluations`;
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

const notifyDeadlines = cron.schedule('7 11 * * *', async () => {
    // establish dates for reference
    const date = new Date();
    const nearDeadline = new Date();
    nearDeadline.setDate(nearDeadline.getDate() + 1);
    const startRange = new Date();
    startRange.setDate(startRange.getDate() + 6);
    const endRange = new Date();
    endRange.setDate(endRange.getDate() + 7);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // find active events
    let [activeApps, activeRounds, activeVetoes, activeReports] = await Promise.all([
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
        Report
            .find({ isActive: true, createdAt: { $lte: sevenDaysAgo } })
            .populate(defaultReportPopulate),
    ]);

    // find and post webhook for reports
    for (let i = 0; i < activeReports.length; i++) {
        const report = activeReports[i];
        const description = `[Report for **${report.culprit ? report.culprit.username : report.link}**](http://bn.mappersguild.com/managereports?id=${report.id}) is more than a week old!`;

        await discord.webhookPost(
            [{
                description,
                color: discord.webhookColors.red,
            }],
            'userReport'
        );
        await util.sleep(500);
    }

    if (activeReports.length) {
        await discord.roleHighlightWebhookPost('report');
        await util.sleep(500);
    }

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
        let trialEvaluators = app.mode == '' ? app.natEvaluators.concat(app.bnEvaluators) : app.natEvaluators;

        if (date > deadline) {
            discordIds = findNatEvaluatorHighlights(app.reviews, trialEvaluators, app.discussion);
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
            description += findNatEvaluatorStatuses(app.reviews, trialEvaluators, app.discussion);
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
        let trialNatList = '';
        let generateWebhook = true;
        let discordIds = [];
        let color;
        let trialEvaluators = round.mode == '' ? round.natEvaluators.concat(round.bnEvaluators) : round.natEvaluators;

        if (!round.natEvaluators || !round.natEvaluators.length) {
            round.natEvaluators = await User.getAssignedNat(round.mode);
            await round.populate(defaultPopulate).execPopulate();
            const days = util.findDaysBetweenDates(new Date(), new Date(round.deadline));

            const assignments = [];

            for (const user of round.natEvaluators) {
                assignments.push({
                    date: new Date(),
                    user: user._id,
                    daysOverdue: days,
                });
            }

            round.natEvaluatorHistory = assignments;

            await round.save();

            natList = round.natEvaluators.map(u => u.username).join(', ');

            if (round.mode == '') {
                if (!round.bnEvaluators || !round.bnEvaluators.length) {
                    round.bnEvaluators = await User.getAssignedTrialNat(round.mode, [round.user.osuId], 2);
                    await round.populate(defaultPopulate).execPopulate();
                    await round.save();
                }

                trialNatList = round.bnEvaluators.map(u => u.username).join(', ');
            }
        }

        if (round.discussion) { // current BN evals in groups have 7 extra days
            const tempDate = new Date(round.deadline);
            tempDate.setDate(tempDate.getDate() + 7);
            round.deadline = tempDate;
        }

        if (date > round.deadline) {
            discordIds = findNatEvaluatorHighlights(round.reviews, trialEvaluators, round.discussion);
            const days = findDaysAgo(round.deadline);

            description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
            color = discord.webhookColors.red;
        } else if (round.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
            color = discord.webhookColors.lightRed;
        } else if (round.deadline > startRange && round.deadline < endRange) {
            description += 'is due in 1 week!';
            color = discord.webhookColors.pink;
        } else {
            generateWebhook = false;
        }

        if (generateWebhook && !natList.length) {
            //evaluators = round.natEvaluators.concat(round.bnEvaluators);

            description += findNatEvaluatorStatuses(round.reviews, trialEvaluators, round.discussion);
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
            let fields = [
                {
                    name: 'Assigned NAT',
                    value: natList,
                },
            ];

            if (trialNatList.length) {
                fields.push({
                    name: 'Assigned BN',
                    value: trialNatList,
                });
            }

            await discord.webhookPost(
                [{
                    description,
                    color,
                    fields,
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
    const twoDaysAgo = new Date();
    const threeDaysAgo = new Date();
    const sevenDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const discussionPopulate = [
        {
            path: 'mediations',
            populate: {
                path: 'mediator',
                select: 'username osuId groups',
            },
        },
        { path: 'creator' },
    ];

    const activeContentReviews = await Discussion
        .find({ isContentReview: true, isActive: true })
        .populate(discussionPopulate);

    for (const discussion of activeContentReviews) {
        const sevenDaysOld = discussion.createdAt < sevenDaysAgo;
        const threeDaysOld = discussion.createdAt < threeDaysAgo;
        const inactive = discussion.updatedAt < twoDaysAgo;

        if (sevenDaysOld || (threeDaysOld && inactive)) {
            await Discussion.findByIdAndUpdate(discussion.id, { isActive: false });

            Logger.generate(
                null,
                'Concluded vote for a discussion',
                'discussionVote',
                discussion._id
            );

            const messages = await discord.contentCaseWebhookPost(discussion);
            await osuBot.sendMessages(discussion.creator.osuId, messages);
        }
    }
}, {
    scheduled: false,
});

const notifyBeatmapReports = cron.schedule('0 * * * *', async () => {
    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;

    // find pending discussion posts
    const parentDiscussions = await osu.getDiscussions(token, '?beatmapset_status=qualified&limit=50&message_types%5B%5D=suggestion&message_types%5B%5D=problem&only_unresolved=on');
    const discussions = parentDiscussions.discussions;

    // find database's discussion posts
    const date = new Date();
    date.setDate(date.getDate() - 10); // used to be 7, but backlog in qualified maps feed caused duplicate reports
    let beatmapReports = await BeatmapReport.find({ createdAt: { $gte: date } });
    await util.sleep(500);

    // create array of reported beatmapsetIds
    const beatmapsetIds = beatmapReports.map(r => r.beatmapsetId);

    for (const discussion of discussions) {
        let messageType = discussion.message_type;
        let discussionMessage = discussion.starting_post.message;
        let userId = discussion.user_id;

        /* NO RE-OPENED POSTS FOR NOW

        // find last reopen if it exists
        const parentPosts = await osu.getDiscussions(token, `/posts?beatmapset_discussion_id=${discussion.id}`);
        const posts = parentPosts.posts;
        await util.sleep(500);

        const postReported = await BeatmapReport.findOne({
            postId: discussion.id,
        });

        // replace discussion details with reopen
        if (postReported && posts[0] && posts[0].id !== discussion.starting_post.id) {
            messageType = `reopen ${messageType}`;
            discussionMessage = posts[0].message;
            userId = posts[0].user_id;
        }

        NO RE-OPENED POSTS FOR NOW */

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
                        value: `${await findUniqueNominationsCount(initialDate, bn)}`,
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
 * Marks BN Finder Matches as Expired if not pending/WIP/graveyard
 */
const checkMatchBeatmapStatuses = cron.schedule('2 22 * * *', async () => {
    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;

    const matches = await BnFinderMatch
        .find({
            isMatch: { $exists: false },
            isExpired: { $ne: true },
        })
        .populate('beatmapset');

    for (const match of matches) {
        const beatmapsetInfo = await osu.getBeatmapsetInfo(token, match.beatmapset.osuId);

        // 4 = loved, 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
        if (beatmapsetInfo.ranked > 0) {
            await BnFinderMatch.findByIdAndUpdate(match.id, { isExpired: true });
        }
    }

    console.log(matches);
}, {
    scheduled: false,
});

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @returns {Promise<number>} number of unique bubbled/qualified
 */
async function findUniqueNominationsCount (initialDate, bn) {
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
 * @param {string} mode
 * @returns {Promise<boolean>} whether or not the user has 'low activity'
 */
async function hasLowActivity (initialDate, bn, mode) {
    const uniqueNominations = await findUniqueNominationsCount(initialDate, bn);

    if (
        (uniqueNominations < 4 && mode == 'mania') ||
        (uniqueNominations < 6 && mode != 'mania')
    ) {
        return true;
    }

    return false;
}

module.exports = { notifyDeadlines, notifyBeatmapReports, lowActivityTask, closeContentReviews, checkMatchBeatmapStatuses };
