const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
const Discussion = require('../../models/discussion');
const ResignationEvaluation = require('../../models/evaluations/resignationEvaluation');
const Aiess = require('../../models/aiess');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const getGeneralEvents = require('../evaluations/bnEval').getGeneralEvents;
const getUserModsCount = require('../../helpers/scrap').getUserModsCount;
const util = require('../../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const evaluationsPopulate = [
    {
        path: 'reviews',
        select: 'evaluator createdAt',
    },
    {
        path: 'user',
        select: 'username',
    },
];

/* GET user list */
router.get('/relevantInfo', async (req, res) => {
    const users = await User
        .find({
            groups: { $in: ['bn', 'nat'] },
        });

    res.json({
        users,
    });
});

/* GET extended user list */
router.get('/loadPreviousBnAndNat', async (req, res) => {
    const users = await User.find({
        history: { $exists: true, $ne: [] },
    }).sort({ username: 1 });

    res.json({ users });
});

/* GET user */
router.get('/loadUser/:userInput', async (req, res) => {
    if (!req.params.userInput.length) {
        return res.json({ error: 'No input' });
    }

    res.json(await User.findByUsernameOrOsuId(req.params.userInput) || await User.findById(req.params.userInput));
});

/* GET user next evaluation */
router.get('/loadNextEvaluation/:id/:mode', async (req, res) => {
    let er = await BnEvaluation.findOne({ user: req.params.id, mode: req.params.mode, active: true });

    if (!er) {
        return res.json('Never');
    }

    const deadline = new Date(er.deadline);
    deadline.setDate(deadline.getDate() + 7);

    res.json(deadline);
});

/* GET find NAT activity */
router.get('/findNatActivity/:days/:mode', async (req, res) => {
    const minAppDate = new Date();
    minAppDate.setDate(minAppDate.getDate() - (parseInt(req.params.days) + 14));
    const minEvalDate = new Date();
    minEvalDate.setDate(minEvalDate.getDate() - (parseInt(req.params.days)));
    const maxDate = new Date();
    const [users, applicationEvaluations, bnEvaluations] = await Promise.all([
        User
            .find({
                groups: 'nat',
                'modesInfo.mode': req.params.mode,
                isBnEvaluator: true,
            })
            .sort({ username: 1 }),

        AppEvaluation
            .find({
                mode: req.params.mode,
                createdAt: { $gte: minAppDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),

        Evaluation
            .find({
                mode: req.params.mode,
                deadline: { $gte: minEvalDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),
    ]);
    let info = [];
    users.forEach(user => {
        let evalsOnBnApps = 0;
        let evalsOnCurrentBnEvals = 0;

        applicationEvaluations.forEach(app => {
            evalsOnBnApps += app.reviews.filter(r => r.evaluator == user.id).length;
        });

        bnEvaluations.forEach(round => {
            evalsOnCurrentBnEvals += round.reviews.filter(r => r.evaluator == user.id).length;
        });

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'nat');
        const lastJoin = joinHistory[joinHistory.length - 1];

        info.push({
            username: user.username,
            osuId: user.osuId,
            totalBnAppEvals: evalsOnBnApps,
            totalCurrentBnEvals: evalsOnCurrentBnEvals,
            joinDate: lastJoin && lastJoin.date,
        });
    });

    res.json({
        info,
        bnAppsCount: applicationEvaluations.length,
        bnEvaluationsCount: bnEvaluations.length,
    });
});

/* GET find NAT activity but cooler */
router.get('/findNatActivity2/:number/:mode', async (req, res) => {
    const limit = parseInt(req.params.number);
    const mode = req.params.mode;

    if (isNaN(limit)) {
        return res.json({ error: 'Invalid number' });
    }

    const [users, appEvals, currentBnEvals] = await Promise.all([
        User
            .find({
                groups: 'nat',
                'modesInfo.mode': mode,
                isBnEvaluator: true,
            })
            .sort({ username: 1 }),

        AppEvaluation
            .find({
                mode,
                active: false,
                feedback: { $exists: true },
                reviews: { $ne: [] },
            })
            .populate(evaluationsPopulate)
            .sort({ updatedAt: -1 })
            .limit(limit),

        Evaluation
            .find({
                mode,
                active: false,
                feedback: { $exists: true },
                reviews: { $ne: [] },
            })
            .populate(evaluationsPopulate)
            .sort({ updatedAt: -1 })
            .limit(limit),
    ]);


    let info = [];
    let total = 0;

    for (const user of users) {
        let participatedAppEvals = 0;
        let participatedCurrentBnEvals = 0;
        let totalFeedbackWritten = 0;
        let recentlyJoinedNat = false;
        let totalDaysOverdue = 0;

        for (const app of appEvals) {
            const relevantEval = app.reviews.filter(r => r.evaluator == user.id);

            if (relevantEval && relevantEval.length) {
                participatedAppEvals ++;
                let manualDeadline = new Date(app.createdAt);
                manualDeadline.setDate(manualDeadline.getDate() + 14);

                totalDaysOverdue += util.findDaysBetweenDates(new Date(relevantEval[0].createdAt), new Date(manualDeadline));
            }
        }

        for (const round of currentBnEvals) {
            const relevantEval = round.reviews.filter(r => r.evaluator == user.id);

            if (relevantEval && relevantEval.length) {
                participatedCurrentBnEvals ++;
                totalDaysOverdue += util.findDaysBetweenDates(new Date(relevantEval[0].createdAt), new Date(round.deadline));
            }
        }

        const totalParticipated = participatedAppEvals + participatedCurrentBnEvals;
        total += totalParticipated;

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'nat');
        const lastJoin = joinHistory[joinHistory.length - 1];

        if (lastJoin.date > appEvals[limit-1].archivedAt || lastJoin.date > currentBnEvals[limit-1].archivedAt) {
            recentlyJoinedNat = true;
        }

        info.push({
            username: user.username,
            osuId: user.osuId,
            participatedAppEvals,
            participatedCurrentBnEvals,
            totalParticipated,
            totalDaysOverdue,
            totalFeedbackWritten,
            recentlyJoinedNat,
            limit,
        });
    }

    for (const app of appEvals) {
        const log = await Logger
            .findOne({
                relatedId: app._id,
                action: `Created feedback of ${app.user.username}'s ${app.mode} evaluation`,
            })
            .populate({ path: 'user', select: 'username osuId' })
            .sort({ createdAt: -1 });


        const userIndex = info.findIndex(u => u.osuId == log.user.osuId);

        if (userIndex > -1) {
            info[userIndex].totalFeedbackWritten++;
        }
    }

    for (const round of currentBnEvals) {
        const log = await Logger
            .findOne({
                relatedId: round._id,
                action: `Created feedback of ${round.user.username}'s ${round.mode} evaluation`,
            })
            .populate({ path: 'user', select: 'username osuId' })
            .sort({ createdAt: -1 });

        const userIndex = info.findIndex(u => u.osuId == log.user.osuId);

        if (userIndex > -1) {
            info[userIndex].totalFeedbackWritten++;
        }
    }

    info.sort((a, b) => {
        if (a.totalParticipated > b.totalParticipated) return -1;
        if (a.totalParticipated < b.totalParticipated) return 1;

        return 0;
    });

    res.json({
        info,
        total,
    });
});

/* GET find BN activity */
router.get('/findBnActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));
    let maxDate = new Date();
    const [users, allEvents, allActiveBnEvaluations] = await Promise.all([
        User
            .find({
                groups: 'bn',
                'modesInfo.mode': req.params.mode,
            })
            .sort({ username: 1 }),
        Aiess.getAllActivity(minDate, maxDate, req.params.mode),
        BnEvaluation.find({ active: true, mode: req.params.mode }),
    ]);

    if (allEvents.error) {
        return res.json({
            error: 'Something went wrong',
        });
    }

    let info = [];
    users.forEach(user => {
        let uniqueNominations = [];
        let nominationResets = 0;

        for (let i = 0; i < allEvents.length; i++) {
            const type = allEvents[i]._id;
            const events = allEvents[i].events;

            if (type == 'nominate' || type == 'qualify') {
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];

                    if (event.userId == user.osuId) {
                        if (uniqueNominations.length == 0 || !uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
                            uniqueNominations.push(event);
                        }
                    }
                }
            } else if (type == 'nomination_reset' || type == 'disqualify') {
                nominationResets += events.filter(e => e.userId == user.osuId).length;
            }
        }

        let activeEval = allActiveBnEvaluations.find(e => e.user == user.id);

        let deadline;

        if (activeEval) {
            deadline = new Date(activeEval.deadline);
            deadline.setDate(deadline.getDate() + 7);
        }

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'bn');
        const lastJoin = joinHistory[joinHistory.length - 1];

        info.push({
            username: user.username,
            osuId: user.osuId,
            uniqueNominations: uniqueNominations.length,
            nominationResets,
            joinDate: lastJoin && lastJoin.date,
            nextEvaluation: deadline,
        });
    });

    res.json(info);
});

router.get('/findGmtActivity/:days', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));

    const [users, discussions] = await Promise.all([
        User
            .find({
                groups: 'gmt',
            })
            .sort({ username: 1 }),

        await Discussion
            .find({
                isContentReview: true,
                updatedAt: { $gte: minDate },
            })
            .populate('mediations'),
    ]);

    let info = [];

    for (const user of users) {
        let totalVotes = 0;

        for (const discussion of discussions) {
            const userMediations = discussion.mediations.filter(m => m.mediator.toString() == user.id);
            totalVotes += userMediations.length;
        }

        info.push({
            username: user.username,
            osuId: user.osuId,
            totalVotes,
        });
    }

    res.json({
        info,
    });
});

/* POST update discord ID */
router.post('/updateDiscordId', middlewares.isNatOrTrialNat, async (req, res) => {
    let user;

    if (req.body.userId) {
        user = await User.findById(req.body.userId);
    } else {
        user = res.locals.userRequest;
    }

    user.discordId = req.body.discordId;
    await user.save();

    res.json({
        success: 'Updated',
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" discord ID to ${user.discordId}`,
        'user',
        user._id
    );
});

/* POST switch bn evaluator */
router.post('/:id/switchBnEvaluator', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnEvaluator = !user.isBnEvaluator;
    await user.save();

    res.json({
        user,
        success: 'Toggled BN evaluator',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`,
        'user',
        user._id
    );
});

/* POST switch/update request status */
router.post('/:id/updateRequestStatus', middlewares.isBnOrNat, async (req, res) => {
    if (req.body.requestLink) {
        util.isValidUrlOrThrow(req.body.requestLink);
    }

    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.requestStatus = req.body.requestStatus;
    user.requestLink = req.body.requestLink;
    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" status to ${user.requestStatus} (${user.requestLink || 'No link'})`,
        'user',
        user._id
    );
});

/* POST switch user group */
router.post('/:id/switchUserGroup', middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (user.isNat) {
        const i = user.groups.findIndex(g => g === 'nat');
        if (i !== -1) user.groups.splice(i, 1, 'bn');
    } else {
        user.isTrialNat = false;
        const i = user.groups.findIndex(g => g === 'bn');
        if (i !== -1) user.groups.splice(i, 1, 'nat');
    }

    for (const mode of user.modesInfo) {
        mode.level = 'full';

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'left',
            group: user.isNat ? 'bn' : 'nat',
            relatedEvaluation: null,
        });

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'joined',
            group: user.isNat ? 'nat' : 'bn',
            relatedEvaluation: null,
        });
    }

    await user.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) from **${user.isNat ? 'BN' : 'NAT'}** to **${user.isNat ? 'NAT' : 'BN'}**.`,
        }],
        'all'
    );

    res.json({
        user,
        success: 'Changed user group',
    });

    Logger.generate(
        req.session.mongoId,
        `Moved "${user.username}" from "${user.isNat ? 'BN' : 'NAT'}" to "${user.isNat ? 'NAT' : 'BN'}"`,
        'user',
        user._id
    );
});

/* GET aiess info */
router.get('/activity', async (req, res) => {
    let days = parseInt(req.query.days);
    if (isNaN(days)) days = 90;
    else if (days > 1000) days = 999;
    else if (days < 2) days = 2;

    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');

    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date(deadline);

    res.json(await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate));
});

/* GET modding info */
router.get('/findModsCount/:username', async (req, res) => {
    res.json(await getUserModsCount(req.session.accessToken, req.params.username));
});

/* GET user next evaluation isResignation field */
router.post('/resignFromBn/:id', async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({ error: 'Unauthorized' });
    }

    const evaluation = await ResignationEvaluation.findOne({ user: req.params.id, active: true });

    if (evaluation) {
        return res.json({ error: 'Resignation is currently being handled by the NAT!' });
    }

    await Evaluation.deleteUserActiveEvaluations(user._id);

    let resignations = [];

    for (const mode of user.modes) {
        resignations.push({ user: user._id, mode, deadline: new Date() });
    }

    const evaluations = await ResignationEvaluation.insertMany(resignations);

    for (const evaluation of evaluations) {
        const assignedNat = await User.getAssignedNat(evaluation.mode, [user.osuId]);
        evaluation.natEvaluators = assignedNat;
        await evaluation.save();
        const natList = assignedNat.map(e => e.username).join(', ');

        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.white,
                description: `Created [**${user.username}**'s resignation eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
                fields: [
                    {
                        name: 'Assigned NAT',
                        value: natList,
                    },
                ],
            }],
            evaluation.mode
        );
        await util.sleep(500);
    }

    res.json({
        success: 'Your removal will be processed soon',
    });
});

module.exports = router;
