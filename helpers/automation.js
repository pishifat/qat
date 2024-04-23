const cron = require('node-cron');
const moment = require('moment');
const discord = require('./discord');
const osu = require('./osu');
const osuv1 = require('./osuv1');
const scrap = require('./scrap');
const osuBot = require('./osuBot');
const util = require('./util');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Evaluation = require('../models/evaluations/evaluation');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const BeatmapReport = require('../models/beatmapReport');
const Veto = require('../models/veto');
const User = require('../models/user');
const Aiess = require('../models/aiess');
const Discussion = require('../models/discussion');
const Report = require('../models/report');
const Logger = require('../models/log');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const Settings = require('../models/settings');

/**
 * Beatmap report feed every hour
 */
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

            await util.sleep(500);

            // send webhook
            await discord.webhookPost(
                [{
                    author: {
                        name: userInfo.username,
                        icon_url: `https://a.ppy.sh/${userId}`,
                        url: `https://osu.ppy.sh/users/${userId}`,
                    },
                    description: `[**${beatmapsetInfo[0].artist} - ${beatmapsetInfo[0].title}**](https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion/-/generalAll#/${discussion.id})\nMapped by [${beatmapsetInfo[0].creator}](https://osu.ppy.sh/users/${beatmapsetInfo[0].creator_id}) [**${modes.join(', ')}**]`,
                    thumbnail: {
                        url: `https://b.ppy.sh/thumb/${discussion.beatmapset_id}.jpg`,
                    },
                    color: messageType.includes('problem') ? discord.webhookColors.red : mongoUser && mongoUser.isBnOrNat ? discord.webhookColors.orange : discord.webhookColors.lightOrange,
                    fields: [
                        {
                            name: messageType,
                            value: discussionMessage.length > 500 ? discussionMessage.slice(0, 500) + '... *(truncated)*' : discussionMessage,
                        },
                    ],
                }],
                'beatmapReport'
            );
            await util.sleep(500);

            // send highlights
            if (messageType.includes('problem') || (mongoUser && mongoUser.isBnOrNat)) {
                modes.forEach(mode => {
                    discord.highlightWebhookPost('', null, `${mode}BeatmapReport`);
                });
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * send webhooks for content reviews
 */
const notifyContentReviews = cron.schedule('0 9 * * *', async () => {
    const twoDaysAgo = moment().subtract(2, 'days').toDate();
    const threeDaysAgo = moment().subtract(3, 'days').toDate();
    const sixDaysAgo = moment().subtract(6, 'days').toDate();
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    const activeContentReviews = await Discussion
        .find({ isContentReview: true, isActive: true })
        .populate([
            {
                path: 'mediations',
                populate: {
                    path: 'mediator',
                    select: 'username osuId groups',
                },
            },
            { path: 'creator' },
        ]);

    for (const discussion of activeContentReviews) {
        const sixDaysOld = discussion.createdAt < sixDaysAgo;
        const sevenDaysOld = discussion.createdAt < sevenDaysAgo;
        const threeDaysOld = discussion.createdAt < threeDaysAgo;
        const inactive = discussion.updatedAt < twoDaysAgo;

        if (sixDaysOld && discussion.mediations.length < 20) {
            let activeContentReviewers = await User.find({ isActiveContentReviewer: true });

            // Create a set of mediator IDs for faster lookup
            let mediatorIds = new Set(discussion.mediations.map(mediation => mediation.mediator.id));

            // Filter out the reviewers who have already voted
            activeContentReviewers = activeContentReviewers.filter(user => !mediatorIds.has(user.id));

            await discord.webhookPost(
                [{
                    description: `[**${discussion.title}**](https://bn.mappersguild.com/discussionvote?id=${discussion.id}) is 6 days old and has less than 20 votes!`,
                    color: discord.webhookColors.lightRed,
                }],
                'internalContentCase'
            );

            util.sleep(500);
            
            if (activeContentReviewers && activeContentReviewers.length) {
                await discord.userHighlightWebhookPost('internalContentCase', activeContentReviewers.map(user => user.discordId));
            }
        }

        else if (sevenDaysOld || (threeDaysOld && inactive && discussion.mediations.length >= 20)) {
            await Discussion.findByIdAndUpdate(discussion.id, { isActive: false });

            Logger.generate(
                null,
                'Concluded vote for a discussion',
                'discussionVote',
                discussion._id
            );

            const { message, channel } = await discord.contentCaseWebhookPost(discussion);
            
            await osuBot.sendAnnouncement([discussion.creator.osuId], channel, message);
        }
    }
}, {
    scheduled: false,
});

/**
 * lock messages on new format evaluations that haven't had activity for a week
 */
const lockEvaluationMessages = cron.schedule('0 10 * * *', async () => {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    // find relevant evaluations
    const [applications, evaluations] = await Promise.all([
        AppEvaluation.find({ archivedAt: { $lt: sevenDaysAgo }}),
        Evaluation.find({ archivedAt: { $lt: sevenDaysAgo }}),
    ]);

    const combined = applications.concat(evaluations);

    // lock anything with inactivity >7d
    for (const eval of combined) {
        if (eval.messages && eval.messages.length) {
            const lastMessageDate = new Date(eval.messages[eval.messages.length - 1].date);

            if (sevenDaysAgo > lastMessageDate) {
                eval.messagesLocked = true;
                eval.save();
            }
        } else {
            eval.messagesLocked = true;
            eval.save();
        }
    }
}, {
    scheduled: false,
});

/**
 * send webhooks for reports submitted 7+ days ago
 */
const notifyReports = cron.schedule('0 17 * * *', async () => {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    // find overdue reports
    const activeReports = await Report
        .find({ isActive: true, createdAt: { $lt: sevenDaysAgo } })
        .populate({ path: 'culprit', select: 'username osuId modesInfo' });

    // post webhook for reports
    for (const report of activeReports) {
        const days = Math.round((new Date().getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        await discord.webhookPost([{
            color: discord.webhookColors.red,
            description: `**Pending [${report.reportCategory}](https://bn.mappersguild.com/managereports?id=${report.id}) needs a response!** (${days} days since submitted)`,
        }],
        'natUserReport');
    }
}, {
    scheduled: false,
});

/**
 * send webhooks for vetoes that are automatically concluded or overdue
 */
const notifyVetoes = cron.schedule('1 17 * * *', async () => {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    // find overdue vetoes
    const activeVetoes = await Veto
        .find({ status: 'wip', deadline: { $lt: sevenDaysAgo } })
        .populate('mediations');

    // process vetoes
    for (const veto of activeVetoes) {
        let autoConclude = true;

        // (un)set condition to automatically conclude vetoes with majority
        for (const [i] of veto.reasons.entries()) {
            let agreeMediations = 0;
            let disagreeMediations = 0;
            const relevantMediations = veto.mediations.filter(m => m.reasonIndex == i);

            for (const mediation of relevantMediations) {
                if (mediation.vote == 1 && mediation.comment) agreeMediations++;
                if (mediation.vote == 3 && mediation.comment) disagreeMediations++;
            }

            if (agreeMediations < (relevantMediations.length/2) && disagreeMediations < (relevantMediations.length/2)) {
                autoConclude = false;
            }
        }

        // send webhooks
        if (autoConclude) { // send archive webhook
            veto.status = 'archive';
            await veto.save();

            await discord.webhookPost(
                [{
                    color: discord.webhookColors.purple,
                    description: `Automatically concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
                }],
                veto.mode
            );
            await util.sleep(500);

            await Logger.generate(
                null,
                `Veto concluded for "${veto.beatmapTitle}"`,
                'veto',
                veto._id
            );
        } else { // send overdue webhook
            await discord.webhookPost(
                [{
                    description: `Veto mediation for [**${veto.beatmapTitle}**](http://bn.mappersguild.com/vetoes?id=${veto.id}) is overdue!`,
                    color: discord.webhookColors.red,
                }],
                veto.mode
            );
            await util.sleep(500);
        }
    }
}, {
    scheduled: false,
});

/**
 * send webhooks for active applications
 */
const notifyApplicationEvaluations = cron.schedule('2 17 * * *', async () => {
    const activeApps = await AppEvaluation.findActiveApps();
    const today = new Date();
    const tomorrow = moment().add(1, 'days').toDate();

    // process apps
    for (const app of activeApps) {
        const deadline = new Date(app.deadline);

        let description = `[**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id}) `;
        let color;
        let generateWebhook;

        // set webhook content based on deadline
        if (today > deadline) {
            const days = util.findDaysBetweenDates(today, deadline);
            description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
            color = discord.webhookColors.red;
            generateWebhook = true;
        } else if (tomorrow > deadline) {
            description += 'is due in less than 24 hours!';
            color = discord.webhookColors.lightRed;
            generateWebhook = true;
        }

        // send webhooks
        if (generateWebhook) {
            const evaluators = await Settings.getModeHasTrialNat(app.mode) ? app.natEvaluators.concat(app.bnEvaluators) : app.natEvaluators;
            description += scrap.findEvaluatorStatuses(app.reviews, evaluators, app.discussion);
            description += scrap.findMissingContent(app.discussion, app.consensus);

            // application status webhook
            await discord.webhookPost(
                [{
                    description,
                    color,
                }],
                app.mode
            );
            await util.sleep(500);

            // discord ping webhook
            const discordIds = discord.findEvaluatorHighlights(app.reviews, evaluators, app.discussion);

            if (discordIds && discordIds.length) {
                await discord.userHighlightWebhookPost(app.mode, discordIds);
                await util.sleep(500);
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * send webhooks for active current bn evals
 */
const notifyCurrentBnEvaluations = cron.schedule('3 17 * * *', async () => {
    const activeBnEvaluations = await Evaluation.findActiveEvaluations(null, true);
    const today = new Date();
    const tomorrow = moment().add(1, 'days').toDate();

    // process evals
    for (const eval of activeBnEvaluations) {
        const deadline = eval.discussion ? moment(eval.deadline).add(7, 'days').toDate() : new Date(eval.deadline); // front-end adds 7 days to deadline for evals in group phase, so webhooks should reflect that

        let description = `[**${eval.user.username}**'s ${eval.user.groups.includes('nat') ? 'NAT eval' : eval.isResignation ? 'resignation' : 'current BN eval'}](http://bn.mappersguild.com/bneval?id=${eval.id}) `;
        let color;
        let generateWebhook;

        const hasAssignedNatEvaluators = eval.natEvaluators && eval.natEvaluators.length;
        const hasAssignedBnEvaluators = eval.natEvaluators && eval.natEvaluators.length;

        // add user assignments
        if (!hasAssignedNatEvaluators) {
            eval.natEvaluators = await User.getAssignedNat(eval.mode, eval.user.id);
            
            if (await Settings.getModeHasTrialNat(eval.mode) && !hasAssignedBnEvaluators) {
                eval.bnEvaluators = await User.getAssignedTrialNat(eval.mode, [eval.user.osuId], (await Settings.getModeEvaluationsRequired(eval.mode) - 1));
            }
    
            // repopulate with evaluator details
            await eval
                .populate([
                    { path: 'natEvaluators', select: 'username discordId isBnEvaluator' },
                    { path: 'bnEvaluators', select: 'username discordId isBnEvaluator' },
                    {
                        path: 'reviews',
                        select: 'evaluator',
                        populate: {
                            path: 'evaluator',
                            select: 'discordId isBnEvaluator',
                        },
                    },
                ])
                .execPopulate();

            await eval.save();
        }

        // set webhook content based on deadline
        if (today > deadline) {
            const days = util.findDaysBetweenDates(today, deadline);
            description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
            color = discord.webhookColors.red;
            generateWebhook = true;
        } else if (tomorrow > deadline) {
            description += 'is due in less than 24 hours!';
            color = discord.webhookColors.lightRed;
            generateWebhook = true;
        } else if (!hasAssignedNatEvaluators) {
            description += 'is due in 1 week!';
            color = discord.webhookColors.pink;
            generateWebhook = true;
        }

        // send webhooks
        if (generateWebhook) {
            const evaluators = await Settings.getModeHasTrialNat(eval.mode) ? eval.natEvaluators.concat(eval.bnEvaluators) : eval.natEvaluators;
            const discordIds = discord.findEvaluatorHighlights(eval.reviews, evaluators, eval.discussion);
            const fields = [];

            // set more webhook content
            if (hasAssignedNatEvaluators) {
                description += scrap.findEvaluatorStatuses(eval.reviews, evaluators, eval.discussion);
                description += scrap.findMissingContent(eval.discussion, eval.consensus);
            } else {
                const natList = eval.natEvaluators.map(u => u.username).join(', ');
                const trialNatList = eval.bnEvaluators.map(u => u.username).join(', ');

                fields.push({
                    name: 'Assigned NAT',
                    value: natList,
                });

                if (trialNatList.length) {
                    fields.push({
                        name: 'Assigned BN',
                        value: trialNatList,
                    });
                }
            }

            // evaluation status webhook
            await discord.webhookPost(
                [{
                    description,
                    color,
                    fields,
                }],
                eval.mode
            );
            await util.sleep(500);

            // discord ping webhook
            if (discordIds && discordIds.length) {
                await discord.userHighlightWebhookPost(eval.mode, discordIds);
                await util.sleep(500);
            }
        }
        
    }
}, {
    scheduled: false,
});

/**
 * @param {number} osuId
 * @param {number} currentBadge
 * @param {number} value
 * @param {string} type
 */
function badgeCommand (osuId, currentBadge, value, type) {
    let command = '';

    if (type == 'nom') {
        value = value / 200;
    }

    const natBadges = ['NAT1y.png', 'NAT2y.png', 'NAT3y.png', 'NAT4y.png', 'NAT5y.png', 'NAT6y.png', 'NAT7y.png', 'NAT8y.png', 'NAT9y.png', 'NAT10y.png'];
    const bnBadges = ['BN1y.png', 'BN2y.png', 'BN3y.png', 'BN4y.png', 'BN5y.png', 'BN6y.png', 'BN7y.png', 'BN8y.png', 'BN9y.png', 'BN10y.png'];
    const nomBadges = ['noms200.png', 'noms400.png', 'noms600.png', 'noms800.png', 'noms1000.png'];
    const natTooltip = [
        'Longstanding contribution to the Nomination Assessment Team - 1 Year',
        'Longstanding contribution to the Nomination Assessment Team - 2 Years',
        'Longstanding contribution to the Nomination Assessment Team - 3 Years',
        'Longstanding contribution to the Nomination Assessment Team - 4 Years',
        'Longstanding contribution to the Nomination Assessment Team - 5 Years',
        'Longstanding contribution to the Nomination Assessment Team - 6 Years',
        'Longstanding contribution to the Nomination Assessment Team - 7 Years',
        'Longstanding contribution to the Nomination Assessment Team - 8 Years',
        'Longstanding contribution to the Nomination Assessment Team - 9 Years',
        'Longstanding contribution to the Nomination Assessment Team - 10 Years',
    ];
    const bnTooltip = [
        'Longstanding contribution to the Beatmap Nominators - 1 Year',
        'Longstanding contribution to the Beatmap Nominators - 2 Years',
        'Longstanding contribution to the Beatmap Nominators - 3 Years',
        'Longstanding contribution to the Beatmap Nominators - 4 Years',
        'Longstanding contribution to the Beatmap Nominators - 5 Years',
        'Longstanding contribution to the Beatmap Nominators - 6 Years',
        'Longstanding contribution to the Beatmap Nominators - 7 Years',
        'Longstanding contribution to the Beatmap Nominators - 8 Years',
        'Longstanding contribution to the Beatmap Nominators - 9 Years',
        'Longstanding contribution to the Beatmap Nominators - 10 Years',
    ];
    const nomTooltip = [
        'Nominated 200+ beatmaps as a Beatmap Nominator',
        'Nominated 400+ beatmaps as a Beatmap Nominator',
        'Nominated 600+ beatmaps as a Beatmap Nominator',
        'Nominated 800+ beatmaps as a Beatmap Nominator',
        'Nominated 1,000+ beatmaps as a Beatmap Nominator',
    ];
    const natWiki = 'https://osu.ppy.sh/wiki/en/People/Nomination_Assessment_Team';
    const bnWiki = 'https://osu.ppy.sh/wiki/en/People/Beatmap_Nominators';
    const nomWiki = 'https://osu.ppy.sh/wiki/en/Beatmap_ranking_procedure#nominations';

    if (type == 'nat') {
        command = `.add-badge ${osuId} ${natBadges[value - 1]} "${natTooltip[value - 1]}" ${natWiki}`;
        (currentBadge >= 1) ? command += ` --replace ${natBadges[currentBadge - 1]}` : '';
    } else if (type == 'bn') {
        command = `.add-badge ${osuId} ${bnBadges[value - 1]} "${bnTooltip[value - 1]}" ${bnWiki}`;
        (currentBadge >= 1) ? command += ` --replace ${bnBadges[currentBadge - 1]}` : '';
    } else if (type == 'nom') {
        command = `.add-badge ${osuId} ${nomBadges[value - 1]} "${nomTooltip[value - 1]}" ${nomWiki}`;
        (currentBadge >= 1) ? command += ` --replace ${nomBadges[currentBadge - 1]}` : '';
    }

    return command;
}

/**
 * Tracks BN-related badges
 */
const badgeTracker = cron.schedule('8 18 * * *', async () => {
    const users = await User.find({ history: { $ne: [], $exists: true } });

    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;
    const natLeaders = await User.find({ isNatLeader: true });
    const discordIds = natLeaders.map(u => u.discordId)

    for (const user of users) {
        // find nomination count stuff
        const mapperInfo = await osu.getOtherUserInfo(token, user.osuId);
        await util.sleep(500);

        const noms = mapperInfo.nominated_beatmapset_count;
        let thresholdNominationCount = 0;

        if (noms >= 200 && noms < 400) {
            thresholdNominationCount = 200;
        } else if (noms >= 400 && noms < 600) {
            thresholdNominationCount = 400;
        } else if (noms >= 600 && noms < 800) {
            thresholdNominationCount = 600;
        } else if (noms >= 800 && noms < 1000) {
            thresholdNominationCount = 800;
        } else if (noms >= 1000) {
            thresholdNominationCount = 1000;
        }

        if (thresholdNominationCount !== user.nominationsProfileBadge * 200) {
            if (discordIds && discordIds.length) {
                await discord.userHighlightWebhookPost('all', discordIds);
                await util.sleep(500);
            }
            
            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu!](https://osu.ppy.sh/users/${user.osuId})) needs new nomination count badge: **${user.nominationsProfileBadge*200} → ${thresholdNominationCount}**\n` + 
                    '`' + badgeCommand(user.osuId, user.nominationsProfileBadge, thresholdNominationCount, 'nom') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/noms${thresholdNominationCount}@2x.png`
                        },
                }],
                'all',
            );
        }

        // find bn badge discrepency
        const bnYears = util.yearsDuration(user.bnDuration + (30 * await scrap.findAdditionalBnMonths(user)));

        if (bnYears <= 10 && bnYears !== user.bnProfileBadge) {
            if (discordIds && discordIds.length) {
                await discord.userHighlightWebhookPost('all', discordIds);
                await util.sleep(500);
            }

            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu!](https://osu.ppy.sh/users/${user.osuId})) needs new BN badge: **${user.bnProfileBadge} → ${bnYears}**\n` + 
                    '`' + badgeCommand(user.osuId, user.bnProfileBadge, bnYears, 'bn') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/BN${bnYears}y@2x.png`
                        },
                }],
                'all',
            );
        }

        // find nat badge discrepency
        const natYears = util.yearsDuration(user.natDuration);

        if (natYears <= 10 && natYears !== user.natProfileBadge) {
            if (discordIds && discordIds.length) {
                await discord.userHighlightWebhookPost('all', discordIds);
                await util.sleep(500);
            }

            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu!](https://osu.ppy.sh/users/${user.osuId})) needs new NAT badge: **${user.natProfileBadge} → ${natYears}** \n` + 
                    '`' + badgeCommand(user.osuId, user.natProfileBadge, natYears, 'nat') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/NAT${natYears}y@2x.png`
                        },
                }],
                'all',
            );
        }
    }
}, {
    scheduled: false,
});

/**
 * bump forward evaluation deadline if probation user has 6+ nominations before 30 days. checked daily
 */
const spawnProbationEvaluations = cron.schedule('0 19 * * *', async () => {
    const probationBns = await User.find({ groups: 'bn', 'modesInfo.level': 'probation' });
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);

    for (const bn of probationBns) {
        const pendingEvaluation = await BnEvaluation.findOne({ user: bn._id, active: true, natEvaluators: [] });

        if (pendingEvaluation) {
            const nomCount = await scrap.findUniqueNominationsCount(new Date(pendingEvaluation.createdAt), new Date(), bn);
            
            if (nomCount >= 6) {
                pendingEvaluation.deadline = newDeadline;
                await pendingEvaluation.save();
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * everything below this point is a development webhook (they only appear for pishifat to find or fix broken things)
 * i also don't fully trust any of them to do what they aim to do, but they're too insignificant to be worth the effort to investigate and fix
 */

/**
 * archive current bn evals for users who are no longer bn/nat
 */
const archiveInvalidEvaluations = cron.schedule('0 17 * * *', async () => {
    const bnEvaluations = await Evaluation.find({ active: true });

    for (const eval of bnEvaluations) {
        const user = await User.findById(eval.user.id);

        if (!user.groups.includes('bn') && !user.groups.includes('nat')) {
            eval.active = false;
            await eval.save();

            await discord.webhookPost(
                [{
                    title: `auto archived ${eval.user.username}'s eval`,
                    color: discord.webhookColors.red,
                    description: `...because they're not in bn/nat anymore. double-check: https://osu.ppy.sh/users/${eval.user.osuId}`,
                }],
                'dev'
            );
        }
    }
}, {
    scheduled: false,
});

/**
 * Check if any current BNs have no upcoming evaluations (basically ensuring the NAT don't archive a card without consensus and forget about it)
 */
const checkBnEvaluationDeadlines = cron.schedule('0 0 1 * *', async () => {
    const bns = await User.find({ groups: 'bn'} );
    for (const bn of bns) {
        for (const mode of bn.modesInfo) {
            const er = await BnEvaluation.findOne({ user: bn.id, mode: mode.mode, active: true });
            const resignation = await ResignationEvaluation.findOne({ user: bn.id, mode: mode.mode, active: true });
            if (!er && !resignation) {
                await discord.webhookPost(
                    [{
                        title: `missing BN evaluation for ${bn.username}`,
                        color: discord.webhookColors.red,
                        description: `https://bn.mappersguild.com/users?id=${bn.id}`,
                    }],
                    'dev'
                );
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * Check if any ex-BNs or ex-NAT have incorrectly accruing tenures
 */
const checkTenureValidity = cron.schedule('0 0 2 * *', async () => {
    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;

    const users = await User.find({
        'history.0': { $exists: true },
    });

    for (const user of users) {
        const mapperInfo = await osu.getOtherUserInfo(token, user.osuId);

        if (mapperInfo && mapperInfo.groups) {
            const isBn = mapperInfo.groups.some(g => g.id == 28 || g.id == 32);
            const isNat = mapperInfo.groups.some(g => g.id == 7);
            
            const bnHistory = user.history.filter(h => h.group == 'bn');
            bnHistory.sort((a, b) => {
                if (new Date(a.date) > new Date(b.date)) return 1;
                if (new Date(a.date) < new Date(b.date)) return -1;
    
                return 0;
            });

            const natHistory = user.history.filter(h => h.group == 'nat');
            natHistory.sort((a, b) => {
                if (new Date(a.date) > new Date(b.date)) return 1;
                if (new Date(a.date) < new Date(b.date)) return -1;
    
                return 0;
            });

            const bnModes = [];
            const natModes = [];

            if (isBn) {
                for (const group of mapperInfo.groups) {
                    if (group.id == 28 || group.id == 32) {
                        for (const playmode of group.playmodes) {
                            if (playmode == 'fruits') {
                                bnModes.push('catch');
                            } else {
                                bnModes.push(playmode);
                            }
                        }
                    }
                }
            }

            if (isNat) {
                for (const group of mapperInfo.groups) {
                    if (group.id == 7) {
                        for (const playmode of group.playmodes) {
                            if (playmode == 'fruits') {
                                natModes.push('catch');
                            } else {
                                natModes.push(playmode);
                            }
                        }
                    }
                }
            }

            const modes = ['osu', 'taiko', 'catch', 'mania'];

            for (const mode of modes) {
                const modeBnHistory = bnHistory.filter(h => h.mode == mode);
                const modeNatHistory = natHistory.filter(h => h.mode == mode);

                const lastModeBnHistory = modeBnHistory.length ? modeBnHistory[modeBnHistory.length - 1] : null;
                const lastModeNatHistory = modeNatHistory.length ? modeNatHistory[modeNatHistory.length - 1] : null;

                let notify = false;

                if (lastModeBnHistory) {
                    if (lastModeBnHistory.kind == 'joined') {
                        if (!bnModes.includes(mode)) {
                            notify = true;
                        }
                    } else {
                        if (bnModes.includes(mode)) {
                            notify = true;
                        }
                    }
                }
                
                if (lastModeNatHistory) {
                    if (lastModeNatHistory.kind == 'joined') {
                        if (!natModes.includes(mode) && mode !== 'none') {
                            notify = true;
                        }
                    } else {
                        if (natModes.includes(mode)) {
                            notify = true;
                        }
                    }
                }

                if (!isBn && !isNat) {
                    if ((lastModeBnHistory && lastModeBnHistory.kind == 'joined') || lastModeNatHistory && lastModeNatHistory.kind == 'joined') {
                        notify = true;
                    }
                }

                if (notify) {
                    await discord.webhookPost(
                        [{
                            title: `${user.username} ${mode} history is sus`,
                            color: discord.webhookColors.red,
                            description: `https://bn.mappersguild.com/users?id=${user.id}`,
                        }],
                        'dev'
                    );
                }

                if (user.groups.length == 1 && user.modesInfo.length > 0) {
                    const userModes = user.modesInfo.map(m => m.mode);
                    
                    if (userModes.includes(mode)) {
                        await discord.webhookPost(
                            [{
                                title: `${user.username} ${mode} modesInfo is sus`,
                                color: discord.webhookColors.red,
                                description: `https://bn.mappersguild.com/users?id=${user.id}`,
                            }],
                            'dev'
                        );
                    }
                }
                
            }
        }

        await util.sleep(500);
    }
}, {
    scheduled: false,
});

module.exports = {
    notifyReports,
    notifyVetoes,
    notifyApplicationEvaluations,
    notifyCurrentBnEvaluations,
    archiveInvalidEvaluations,
    lockEvaluationMessages,
    notifyContentReviews,
    checkBnEvaluationDeadlines,
    checkTenureValidity,
    badgeTracker,
    notifyBeatmapReports,
    spawnProbationEvaluations
};
