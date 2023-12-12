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
const { BnEvaluationConsensus, BnEvaluationAddition } = require('../shared/enums');
const { makeWordFromField } = require('./scrap');
const Settings = require('../models/settings');

const defaultPopulate = [
    { path: 'user', select: 'id username osuId modesInfo groups' },
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

/**
 * @param {Array} reviews
 * @param {Array} evaluators
 * @param {Boolean} discussion
 * @returns {string} text for webhook
 */
function findNatEvaluatorStatuses(reviews, evaluators, discussion) {
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
function findMissingContent(discussion, consensus, feedback) {
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
function findDaysAgo(deadline) {
    const today = new Date();
    const contacted = new Date(deadline);
    const days = Math.round((today.getTime() - contacted.getTime()) / (1000 * 60 * 60 * 24));

    return days;
}

const notifyDeadlines = cron.schedule('0 17 * * *', async () => {
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

        Veto
            .find({ status: 'wip' })
            .populate('mediations'),
        Report
            .find({ isActive: true, createdAt: { $lt: sevenDaysAgo } })
            .populate(defaultReportPopulate),
    ]);

    // post webhook for reports
    for (const report of activeReports) {
        const days = Math.round((new Date().getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        discord.webhookPost([{
            color: discord.webhookColors.red,
            description: `**Pending [${report.reportCategory}](https://bn.mappersguild.com/managereports?id=${report.id}) needs a response!** (${days} days since submitted)`,
        }],
        'natUserReport');
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

        let agreeMediations = 0;
        let disagreeMediations = 0;

        if (veto.reasons.length == 1) {
            for (const mediation of veto.mediations) {
                if (mediation.vote == 1 && mediation.comment) agreeMediations++;
                if (mediation.vote == 3 && mediation.comment) disagreeMediations++;
            }
        }

        if ((agreeMediations > (veto.mediations.length/2) || disagreeMediations > (veto.mediations.length/2)) && (veto.deadline < date)) {
            veto.status = 'archive';
            await veto.save();

            Logger.generate(
                null,
                `Veto concluded for "${veto.beatmapTitle}"`,
                'veto',
                veto._id
            );
            
            const submittedMediations = agreeMediations + disagreeMediations;

            let conclusion = `Automatically concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;
            conclusion += '\n\n';
            conclusion += `- **Agree:** ${agreeMediations} (${Math.round(agreeMediations / submittedMediations * 100) || '0'}%)\n`;
            conclusion += `- **Disagree:** ${disagreeMediations} (${Math.round(disagreeMediations / submittedMediations * 100)  || '0'}%)\n`;
            conclusion += `- **Submitted votes:** ${submittedMediations} (${Math.round(submittedMediations / veto.mediations.length * 100) || '0'}%)\n`;
            conclusion += `- **Assigned mediators:** ${veto.mediations.length}`;
            conclusion += '\n\n';
            conclusion += `Consensus: **${agreeMediations > disagreeMediations ? 'Upheld' : 'Dismissed'}**`;
            
            discord.webhookPost([{
                color: discord.webhookColors.purple,
                description: conclusion,
            }],
            veto.mode);
        } else if (date > veto.deadline || veto.deadline < nearDeadline) {
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
        let evaluators = await Settings.getModeHasTrialNat(app.mode) ? app.natEvaluators.concat(app.bnEvaluators) : app.natEvaluators;

        if (date > deadline) {
            discordIds = discord.findNatEvaluatorHighlights(app.reviews, evaluators, app.discussion);
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
            description += findNatEvaluatorStatuses(app.reviews, evaluators, app.discussion);
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
        const user = await User.findById(round.user.id);

        // automatically archive non-usergrouped users
        if (!user.groups.includes('bn') && !user.groups.includes('nat')) {
            round.active = false;
            await round.save();

            await discord.webhookPost(
                [{
                    title: `auto archived ${round.user.username}'s eval`,
                    color: discord.webhookColors.red,
                    description: `...because they're not in bn/nat anymore. double-check: https://osu.ppy.sh/users/${round.user.osuId}`,
                }],
                'dev'
            );

        // handle actual bn/nat evals
        } else {
            let description = `[**${round.user.username}**'s ${round.user.groups.includes('nat') ? 'NAT eval' : round.isResignation ? 'resignation' : 'current BN eval'}](http://bn.mappersguild.com/bneval?id=${round.id}) `;
            let natList = '';
            let trialNatList = '';
            let generateWebhook = true;
            let color;
            let evaluators = await Settings.getModeHasTrialNat(round.mode) ? round.natEvaluators.concat(round.bnEvaluators) : round.natEvaluators;
            let discordIds = discord.findNatEvaluatorHighlights(round.reviews, evaluators, round.discussion);
            let toggleActivityAutomation = false;

            // add user assignments + check for basic activity requirements
            if (round.deadline < endRange && (!round.natEvaluators || !round.natEvaluators.length)) {
                round.natEvaluators = await User.getAssignedNat(round.mode, round.user.id);
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

                const initialDate90 = moment().subtract(90, 'days').toDate();
                const userHasLowActivity = await hasLowActivity(initialDate90, round.user, round.mode, 90);

                // need to check for full bn
                if (userHasLowActivity && !round.user.probationModes.includes(round.mode)) {
                    console.log('in');
                    toggleActivityAutomation = true;
                    round.discussion = true;
                    round.addition = BnEvaluationAddition.LowActivityWarning;
                    let minimumNomsCount;

                    switch (round.mode) {
                        case 'osu':
                        case 'taiko':
                            minimumNomsCount = 6;
                            break;
                        case 'catch':
                        case 'mania':
                            minimumNomsCount = 4;
                            break;
                    }

                    const uniqueNomsCount = await scrap.findUniqueNominationsCount(initialDate90, new Date(), round.user);
                    const activityIsTooLow = uniqueNomsCount < minimumNomsCount;

                    if (activityIsTooLow) {
                        round.consensus = BnEvaluationConsensus.RemoveFromBn;
                        round.hasCooldown = false;
                        round.cooldownDate = new Date();
                        round.feedback = `Hello ${round.user.username},\n\nUnfortunately, you have nominated ${uniqueNomsCount} beatmaps out of the required ${(round.mode == 'osu' || round.mode == 'taiko') ? 9 : 6} nominations in a 90-day period, which means we have to remove you from the Beatmap Nominators for not reaching the bottom line activity requirement (${(round.mode == 'osu' || round.mode == 'taiko') ? 6 : 4} nominations).\n\nYou may re-apply at any time, given that you provide 3 mods for us to evaluate. Good luck!\n\n—NAT`;
                    } else {
                        round.consensus = BnEvaluationConsensus.FullBn;
                        round.feedback = `Hello ${round.user.username},\n\nUnfortunately, you have nominated ${uniqueNomsCount} beatmaps out of the required ${(round.mode == 'osu' || round.mode == 'taiko') ? 9 : 6} nominations in a 90-day period, which means we have to issue you an **activity warning**. You will be given approximately 1 month to reach minimum activity, and failing to do so will result in a removal from the Beatmap Nominators.\n\nYour next evaluation will be in one month, good luck!\n\n—NAT`;
                    }
                }

                await round.save();

                natList = round.natEvaluators.map(u => u.username).join(', ');

                if (await Settings.getModeHasTrialNat(round.mode)) {
                    if (!round.bnEvaluators || !round.bnEvaluators.length) {
                        round.bnEvaluators = await User.getAssignedTrialNat(round.mode, [round.user.osuId], (await Settings.getModeEvaluationsRequired(round.mode) - 1));
                        await round.populate(defaultPopulate).execPopulate();
                        await round.save();
                    }

                    trialNatList = round.bnEvaluators.map(u => u.username).join(', ');
                }
            }

            // current BN evals in groups have 7 extra days, unless activity check above negates
            if (round.discussion && !toggleActivityAutomation) { 
                const tempDate = new Date(round.deadline);
                tempDate.setDate(tempDate.getDate() + 7);
                round.deadline = tempDate;
            }

            // overdue
            if (date > round.deadline) {
                const days = findDaysAgo(round.deadline);

                description += `was due ${days == 0 ? 'today!' : days == 1 ? days + ' day ago!' : days + ' days ago!'}`;
                color = discord.webhookColors.red;

            // <24 hours til due
            } else if (round.deadline < nearDeadline) {
                description += 'is due in less than 24 hours!';
                color = discord.webhookColors.lightRed;

            // between 6-7 days, or no user assignments
            } else if ((round.deadline > startRange && round.deadline < endRange) || (round.deadline < endRange && (!round.natEvaluators || !round.natEvaluators.length))) {
                description += 'is due in 1 week!';
                color = discord.webhookColors.pink;

                if (toggleActivityAutomation) {
                    description += `\n\nConsensus and feedback have already been set due to user's low nomination activity.`;
                }

            // no webhook otherwise
            } else {
                generateWebhook = false;
            }

            // generate reminder webhooks
            if (generateWebhook && !natList.length) {
                description += findNatEvaluatorStatuses(round.reviews, evaluators, round.discussion);
                description += findMissingContent(round.discussion, round.consensus, round.feedback);
                await discord.webhookPost(
                    [{
                        description,
                        color,
                    }],
                    round.mode
                );
                await util.sleep(500);

                discordIds = discord.findNatEvaluatorHighlights(round.reviews, evaluators, round.discussion);
                await discord.userHighlightWebhookPost(round.mode, discordIds);
                await util.sleep(500);

            // generate assignment webhooks
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

                // repeating "evaluators" and "discordIds" to get newly populated info into highlight webhook
                evaluators = await Settings.getModeHasTrialNat(round.mode) ? round.natEvaluators.concat(round.bnEvaluators) : round.natEvaluators;
                discordIds = discord.findNatEvaluatorHighlights(round.reviews, evaluators, round.discussion);

                await discord.userHighlightWebhookPost(round.mode, discordIds);
                await util.sleep(500);
            }
        }
    }
}, {
    scheduled: false,
});

const handleContentReviews = cron.schedule('0 9 * * *', async () => {
    const twoDaysAgo = new Date();
    const threeDaysAgo = new Date();
    const sixDaysAgo = new Date();
    const sevenDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
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
                    description: `[**${discussion.title}**](https://bn.mappersguild.com/discussions?id=${discussion.id}) is 6 days old and has less than 20 votes!`,
                    color: discord.webhookColors.lightRed,
                }],
                'internalContentCase'
            );

            util.sleep(500);
            
            await discord.userHighlightWebhookPost('internalContentCase', activeContentReviewers.map(user => user.discordId));
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
 * Checks for bns with less than 6 mods (4 for mania) over the course of 90 days the first day of every month
 */
const lowActivityTask = cron.schedule('0 23 1 * *', async () => {
    const lowActivityFields90 = [];
    const lowActivityFields30 = [];
    const initialDate90 = moment().subtract(90, 'days').toDate();
    const initialDate30 = moment().subtract(30, 'days').toDate();

    const bns = await User.find({ groups: 'bn' });

    for (const bn of bns) {
        const joinedHistory = bn.history.filter(h => h.kind === 'joined');
        const date = joinedHistory[joinedHistory.length - 1].date;

        if (new Date(date) < initialDate90 || (await scrap.findUniqueNominationsCount(date, new Date(), bn) == 0)) {
            for (const mode of bn.modes) {
                if (await hasLowActivity(initialDate90, bn, mode, 90)) {
                    lowActivityFields90.push({
                        name: bn.username,
                        value: `${await scrap.findUniqueNominationsCount(initialDate90, new Date(), bn)}`,
                        inline: true,
                        mode,
                    });
                }
                if (await hasLowActivity(initialDate30, bn, mode, 30)) {
                    lowActivityFields30.push({
                        name: bn.username,
                        value: `${await scrap.findUniqueNominationsCount(initialDate30, new Date(), bn)}`,
                        inline: true,
                        mode,
                    });
                }
            }
        }
    }

    if (!lowActivityFields90.length) return;

    // i don't care how stupid this is. this is how it's being done.
    let formatField90 = { name: 'username', value: 'nominations within 3 months' };
    let formatField30 = { name: 'username', value: 'nominations within 1 month' };
    let osuFields90 = [];
    let taikoFields90 = [];
    let catchFields90 = [];
    let maniaFields90 = [];
    let osuFields30 = [];
    let taikoFields30 = [];
    let catchFields30 = [];
    let maniaFields30 = [];
    osuFields90.push(formatField90);
    taikoFields90.push(formatField90);
    catchFields90.push(formatField90);
    maniaFields90.push(formatField90);
    osuFields30.push(formatField30);
    taikoFields30.push(formatField30);
    catchFields30.push(formatField30);
    maniaFields30.push(formatField30);

    for (const field of lowActivityFields90) {
        switch (field.mode) {
            case 'osu':
                osuFields90.push(field);
                break;
            case 'taiko':
                taikoFields90.push(field);
                break;
            case 'catch':
                catchFields90.push(field);
                break;
            case 'mania':
                maniaFields90.push(field);
                break;
        }
    }

    for (const field of lowActivityFields30) {
        switch (field.mode) {
            case 'osu':
                osuFields30.push(field);
                break;
            case 'taiko':
                taikoFields30.push(field);
                break;
            case 'catch':
                catchFields30.push(field);
                break;
            case 'mania':
                maniaFields30.push(field);
                break;
        }
    }

    const modeFields = [osuFields90, taikoFields90, catchFields90, maniaFields90, osuFields30, taikoFields30, catchFields30, maniaFields30];
    const modes = ['osu', 'taiko', 'catch', 'mania', 'osu', 'taiko', 'catch', 'mania']; // this is where it gets really stupid and i am embarrassed

    for (let i = 0; i < modeFields.length; i++) {
        const modeField = modeFields[i];

        if (modeField.length > 1) { // only create webhook if there are users with low activity in mode
            await discord.webhookPost(
                [{
                    title: `Low Activity ${i >= 4 ? '(30 days)' : '(90 days)'}`,
                    description: `The following users have low activity from ${i >= 4 ? initialDate30.toISOString().slice(0, 10) : initialDate90.toISOString().slice(0, 10)} to today`,
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
 * Check if any current BNs have no upcoming evaluations (basically ensuring the NAT don't make a mistake and forget about it)
 */
const checkBnEvaluationDeadlines = cron.schedule('3 22 * * *', async () => {
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
const checkTenureValidity = cron.schedule('40 4 4 * *', async () => {
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

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @param {string} mode
 * @param {number} days
 * @returns {Promise<boolean>} whether or not the user has 'low activity'
 */
async function hasLowActivity(initialDate, bn, mode, days) {
    const uniqueNominationsCount = await scrap.findUniqueNominationsCount(initialDate, new Date(), bn);

    if (
        (uniqueNominationsCount < (2 * (days/30)) && (mode == 'mania' || mode == 'catch')) ||
        (uniqueNominationsCount < (3 * (days/30)) && (mode == 'osu' || mode == 'taiko'))
    ) {
        return true;
    }

    return false;
}

/**
 * Checks for bns with less than required nomination count daily
 */
const lowActivityPerUserTask = cron.schedule('17 19 * * *', async () => {
    const initialDate90 = moment().subtract(90, 'days').toDate();
    const initialDate30 = moment().subtract(30, 'days').toDate();
    const initialDate15 = moment().subtract(10, 'days').toDate();
    const initialDate7 = moment().subtract(7, 'days').toDate();

    const bns = await User.find({ groups: 'bn' });

    for (const bn of bns) {
        const joinedHistory = bn.history.filter(h => h.kind === 'joined');
        const date = joinedHistory[joinedHistory.length - 1].date;

        const newBnWarning = (await scrap.findUniqueNominationsCount(date, new Date(), bn) == 0) && initialDate15 > date;

        if (new Date(date) < initialDate90 || newBnWarning)  {
            for (const mode of bn.modes) {
                if (await hasLowActivity(initialDate90, bn, mode, 90)) {
                    if ((new Date(bn.lastMarkedAsLowActivity) < initialDate30 && !newBnWarning) || (new Date(bn.lastMarkedAsLowActivity) < initialDate7 && newBnWarning)) {
                        bn.lastMarkedAsLowActivity = new Date();
                        await bn.save();
                    
                        let role;

                        switch (mode) {
                            case 'osu':
                                role = 'natEvaluatorOsu';
                                break;
                            case 'taiko':
                                role = 'natEvaluatorTaiko';
                                break;
                            case 'catch':
                                role = 'natEvaluatorCatch';
                                break;
                            case 'mania':
                                role = 'natEvaluatorMania';
                                break;
                        }

                        const text = `**${bn.username}** (<https://osu.ppy.sh/users/${bn.osuId}>) - ${await scrap.findUniqueNominationsCount(initialDate90, new Date(), bn)} nominations ${newBnWarning ? 'since joining BN >15 days ago!' : 'in 90 days!'}`;

                        await discord.roleHighlightWebhookPost(mode, [role], text);
                    }
                }
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * @param {number} days
 */
function yearsDuration(days) {
    return Math.floor(days / 365);
}

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

    const natBadges = ['QAT1y.png', 'QAT2y.png', 'QAT3y.jpg', 'QAT4y.jpg', 'QAT5y.jpg'];
    const bnBadges = ['BN1y.png', 'BN2y.jpg', 'BN3y.jpg', 'BN4y.jpg', 'BN5y.jpg'];
    const nomBadges = ['noms200.png', 'noms400.png', 'noms600.png', 'noms800.png', 'noms1000.png'];
    const natTooltip = [
        'Longstanding contribution to the Nomination Assessment Team - 1 Year',
        'Longstanding contribution to the Nomination Assessment Team - 2 Years',
        'Longstanding contribution to the Nomination Assessment Team - 3 Years',
        'Longstanding contribution to the Nomination Assessment Team - 4 Years',
        'Longstanding contribution to the Nomination Assessment Team - 5 Years',
    ];
    const bnTooltip = [
        'Longstanding contribution to the Beatmap Nominators - 1 Year',
        'Longstanding contribution to the Beatmap Nominators - 2 Years',
        'Longstanding contribution to the Beatmap Nominators - 3 Years',
        'Longstanding contribution to the Beatmap Nominators - 4 Years',
        'Longstanding contribution to the Beatmap Nominators - 5 Years',
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

        if (thresholdNominationCount !== user.nominationsProfileBadge*200) {
            await discord.userHighlightWebhookPost('all', discordIds);
            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu](https://osu.ppy.sh/users/${user.osuId})) needs new nomination count badge: **${user.nominationsProfileBadge*200} → ${thresholdNominationCount}**\n` + 
                    '`' + badgeCommand(user.osuId, user.nominationsProfileBadge, thresholdNominationCount, 'nom') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/noms${thresholdNominationCount}.png`
                        },
                }],
                'all',
            );
        }

        // find bn badge discrepency
        const bnYears = yearsDuration(user.bnDuration + (30 * await scrap.findAdditionalBnMonths(user)));

        if (bnYears <= 5 && bnYears !== user.bnProfileBadge) {
            let filename;

            switch (bnYears) {
                case 1:
                    filename = 'BN1y.png';
                    break;
                default:
                    filename = `BN${bnYears}y.jpg`
                    break;
            }

            await discord.userHighlightWebhookPost('all', discordIds);
            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu](https://osu.ppy.sh/users/${user.osuId})) needs new BN badge: **${user.bnProfileBadge} → ${bnYears}**\n` + 
                    '`' + badgeCommand(user.osuId, user.bnProfileBadge, bnYears, 'bn') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/${filename}`
                        },
                }],
                'all',
            );
        }

        // find nat badge discrepency
        const natYears = yearsDuration(user.natDuration);

        if (natYears <= 5 && natYears !== user.natProfileBadge) {
            let filename;

            switch (natYears) {
                case 1:
                    filename = 'QAT1y.png';
                    break;
                case 1:
                    filename = 'QAT2y.png';
                    break;
                default:
                    filename = `QAT${natYears}y.jpg`
                    break;
            }
    
            await discord.userHighlightWebhookPost('all', discordIds);
            await discord.webhookPost(
                [{
                    color: discord.webhookColors.darkOrange,
                    description: `[**${user.username}**](https://bn.mappersguild.com/users?id=${user.id}) ([osu](https://osu.ppy.sh/users/${user.osuId})) needs new NAT badge: **${user.natProfileBadge} → ${natYears}** \n` + 
                    '`' + badgeCommand(user.osuId, user.natProfileBadge, natYears, 'nat') + '`',
                    image: 
                        {
                            url: `https://assets.ppy.sh/profile-badges/${filename}`
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
 * Validate beatmaps info on events, once per hour (xx:40)
 */
const validateEvents = cron.schedule('40 * * * *', async () => {
    const events = await Aiess
        .find({ validated: { $ne: true }, beatmapsetId: { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(500);

    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;

    for (const event of events) {
        const beatmapsetInfo = await osu.getBeatmapsetInfo(token, event.beatmapsetId);
        await util.sleep(500);

        console.log(beatmapsetInfo.artist + ' - ' + beatmapsetInfo.title);

        if (beatmapsetInfo.ranked == 1) {
            event.beatmaps = [];

            for (const beatmap of beatmapsetInfo.beatmaps) {
                const slimBeatmap = {
                    drain: beatmap.hit_length,
                    starRating: beatmap.difficulty_rating,
                    userRating: 0, // this field is irrelevant after validation
                };

                event.beatmaps.push(slimBeatmap);
            }

            event.validated = true;
            await event.save();
        }
    }
}, {
    scheduled: false,
});

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
            console.log(beatmapsetInfo);

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
                    discord.highlightWebhookPost('', `${mode}BeatmapReport`);
                });
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * bump forward evaluation deadline if probation user has 6+ nominations before 30 days. checked daily
 */
const spawnProbationEvaluations = cron.schedule('0 16 * * *', async () => {
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

module.exports = { notifyDeadlines, lowActivityTask, handleContentReviews, checkBnEvaluationDeadlines, lowActivityPerUserTask, checkTenureValidity, badgeTracker, validateEvents, notifyBeatmapReports, spawnProbationEvaluations };
