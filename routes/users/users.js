const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const Aiess = require('../../models/aiess');
const middlewares = require('../../helpers/middlewares');
const getGeneralEvents = require('../evaluations/bnEval').getGeneralEvents;

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
    const invalids = [8129817, 3178418];
    const [users, bnApps, bnRounds] = await Promise.all([
        User
            .find({
                groups: 'nat',
                'modesInfo.mode': req.params.mode,
            })
            .sort({ username: 1 }),

        AppEvaluation
            .find({
                mode: req.params.mode,
                createdAt: { $gte: minAppDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),

        BnEvaluation
            .find({
                mode: req.params.mode,
                deadline: { $gte: minEvalDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),
    ]);
    let info = [];
    users.forEach(user => {
        if (invalids.indexOf(user.osuId) == -1) {
            let evalsOnBnApps = 0;
            let evalsOnCurrentBnEvals = 0;

            bnApps.forEach(app => {
                evalsOnBnApps += app.reviews.filter(r => r.evaluator == user.id).length;
            });

            bnRounds.forEach(round => {
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
        }
    });

    res.json({
        info,
        bnAppsCount: bnApps.length,
        evalRoundsCount: bnRounds.length,
    });
});

router.get('/findBnActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));
    let maxDate = new Date();
    const [users, allEvents, allActiveEvalRounds, allQualityAssuranceChecks] = await Promise.all([
        User.find({
            groups: 'bn',
            'modesInfo.mode': req.params.mode,
        }).sort({ username: 1 }),
        Aiess.getAllActivity(minDate, maxDate, req.params.mode),
        BnEvaluation.find({ active: true, mode: req.params.mode }),
        Aiess.find({ qualityAssuranceCheckers: { $exists: true, $ne: [] }, timestamp: { $gt: minDate } }),
    ]);

    let info = [];
    users.forEach(user => {
        let uniqueNominations = [];
        let nominationResets = 0;
        let qualityAssuranceChecks = allQualityAssuranceChecks.filter(qa => qa.qualityAssuranceCheckers.includes(user.id)).length;

        for (let i = 0; i < allEvents.length; i++) {
            const eventType = allEvents[i]._id;
            const events = allEvents[i].events;

            if (eventType == 'Bubbled' || eventType == 'Qualified') {
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];

                    if (event.userId == user.osuId) {
                        if (uniqueNominations.length == 0) {
                            uniqueNominations.push(events);
                        } else if (!uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
                            uniqueNominations.push(event);
                        }
                    }
                }
            } else if (eventType == 'Popped' || eventType == 'Disqualified') {
                nominationResets += events.filter(e => e.userId == user.osuId).length;
            }
        }

        let activeEval = allActiveEvalRounds.find(e => e.user == user.id);
        let deadline = 'Never';
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

/* GET aiess info */
router.get('/activity', async (req, res) => {
    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');
    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(deadline);

    res.json(await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate));
});

module.exports = router;
