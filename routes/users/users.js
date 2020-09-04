const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
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
        select: 'evaluator',
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    const users = await User
        .find({
            groups: { $in: ['bn', 'nat'] },
        });

    res.json({
        users,
    });
});

/* GET applicant listing. */
router.get('/loadPreviousBnAndNat', async (req, res) => {
    const users = await User.find({
        history: { $exists: true, $ne: [] },
    }).sort({ username: 1 });

    res.json({ users });
});

/* GET user next evaluation */
router.get('/loadNextEvaluation/:id', async (req, res) => {
    let er = await BnEvaluation.findOne({ user: req.params.id, active: true });

    if (!er) {
        return res.json('Never');
    }

    res.json(er.deadline);
});

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

router.get('/findBnActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));
    let maxDate = new Date();
    const [users, allEvents, allActiveBnEvaluations, allQualityAssuranceChecks] = await Promise.all([
        User
            .find({
                groups: 'bn',
                'modesInfo.mode': req.params.mode,
            })
            .sort({ username: 1 }),
        Aiess.getAllActivity(minDate, maxDate, req.params.mode),
        BnEvaluation.find({ active: true, mode: req.params.mode }),
        Aiess.find({ qualityAssuranceCheckers: { $exists: true, $ne: [] }, timestamp: { $gt: minDate } }),
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
        let qualityAssuranceChecks = allQualityAssuranceChecks.filter(qa => qa.qualityAssuranceCheckers.includes(user.id)).length;

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
        if (activeEval) deadline = activeEval.deadline;

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'bn');
        const lastJoin = joinHistory[joinHistory.length - 1];

        info.push({
            username: user.username,
            osuId: user.osuId,
            uniqueNominations: uniqueNominations.length,
            nominationResets,
            joinDate: lastJoin && lastJoin.date,
            nextEvaluation: deadline,
            qualityAssuranceChecks,
        });
    });

    res.json(info);
});

/* POST switch bn evaluator */
router.post('/:id/switchBnEvaluator', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnEvaluator = !user.isBnEvaluator,
    await user.save();

    res.json(user);
    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`,
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
        const i = user.groups.findIndex(g => g === 'bn');
        if (i !== -1) user.groups.splice(i, 1, 'nat');
    }

    for (const mode of user.modesInfo) {
        mode.level = 'full';

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'left',
            group: user.isNat ? 'nat' : 'bn',
            relatedEvaluation: null,
        });

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'joined',
            group: user.isNat ? 'bn' : 'nat',
            relatedEvaluation: null,
        });
    }

    await user.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) from **${user.isNat ? 'NAT' : 'BN'}** to **${user.isNat ? 'BN' : 'NAT'}**.`,
        }],
        'all'
    );

    res.json(user);
    Logger.generate(
        req.session.mongoId,
        `Moved "${user.username}" from "${user.isNat ? 'NAT' : 'BN'}" to "${user.isNat ? 'BN' : 'NAT'}"`,
        'user',
        user._id
    );
});

/* GET aiess info */
router.get('/activity', async (req, res) => {
    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');
    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 120);
    let maxDate = new Date(deadline);

    res.json(await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate));
});

/* GET modding info */
router.get('/findModsCount/:username', async (req, res) => {
    res.json(await getUserModsCount(req.params.username));
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
        const assignedNat = await User.getAssignedNat(evaluation.mode);
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

    res.json({ success: 'ok' });
});

module.exports = router;
