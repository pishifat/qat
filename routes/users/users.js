const express = require('express');
const api = require('../../helpers/api');
const User = require('../../models/user');
const Logger = require('../../models/log');
const BnApp = require('../../models/bnApp');
const EvalRound = require('../../models/evalRound');
const Aiess = require('../../models/aiess');

const router = express.Router();

router.use(api.isLoggedIn);

const evaluationsPopulate = [
    {
        path: 'evaluations',
        select: 'evaluator',
    },
];

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('users', {
        title: 'BN/NAT Listing',
        script: '../javascripts/users.js',
        loggedInAs: req.session.mongoId,
        isUsers: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    const users = await User.find({
        $or: [
            { group: 'nat' },
            { group: 'bn' },
        ],
    }).sort({ username: 1 });

    res.json({
        users,
        userId: req.session.mongoId,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isBn: res.locals.userRequest.group == 'bn',
    });
});

/* GET applicant listing. */
router.get('/loadPreviousBnAndNat', async (req, res) => {
    const users = await User.find({
        $or: [
            { bnDuration: { $ne: [], $exists: true } },
            { natDuration: { $ne: [], $exists: true } },
        ],
    }).sort({ username: 1 });

    res.json({ users });
});

/* GET user next evaluation */
router.get('/loadNextEvaluation/:id', async (req, res) => {
    let er = await EvalRound.findOne({ bn: req.params.id, active: true });

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
                group: 'nat',
                modes: req.params.mode,
                isSpectator: { $ne: true },
            })
            .sort({ username: 1 }),

        BnApp
            .find({
                mode: req.params.mode,
                createdAt: { $gte: minAppDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),

        EvalRound
            .find({
                mode: req.params.mode,
                deadline: { $gte: minEvalDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),
    ]);
    const bnAppsCount = bnApps.length;
    const evalRoundsCount = bnRounds.length;
    let info = [];
    users.forEach(user => {
        if (invalids.indexOf(user.osuId) == -1) {
            let evalsOnBnApps = 0;
            let evalsOnCurrentBnEvals = 0;
            let feedbackCount = 0;

            bnApps.forEach(app => {
                app.evaluations.forEach(evaluation => {
                    if (evaluation.evaluator == user.id) {
                        evalsOnBnApps++;
                    }
                });

                if (app.feedbackAuthor == user.id) {
                    feedbackCount++;
                }
            });

            bnRounds.forEach(round => {
                round.evaluations.forEach(evaluation => {
                    if (evaluation.evaluator == user.id) {
                        evalsOnCurrentBnEvals++;
                    }
                });

                if (round.feedbackAuthor == user.id) {
                    feedbackCount++;
                }
            });

            info.push({
                username: user.username,
                osuId: user.osuId,
                totalBnAppEvals: evalsOnBnApps,
                totalCurrentBnEvals: evalsOnCurrentBnEvals,
                totalWrittenFeedbacks: feedbackCount,
                joinDate: user.natDuration[user.natDuration.length - 1],
            });
        }
    });

    res.json({ info, bnAppsCount, evalRoundsCount });
});

router.get('/findBnActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));
    let maxDate = new Date();
    const [users, allEvents, allActiveEvalRounds, allQualityAssuranceChecks] = await Promise.all([
        User.find({
            group: 'bn',
            modes: req.params.mode,
            isSpectator: { $ne: true },
        }).sort({ username: 1 }),
        Aiess.getAllActivity(minDate, maxDate, req.params.mode),
        EvalRound.find({ active: true }),
        Aiess.find({ qualityAssuranceCheckers: { $exists: true, $ne: [] }, timestamp: { $gt: minDate } }),
    ]);

    let info = [];
    users.forEach(user => {
        let uniqueNominations = [];
        let nominationResets = 0;
        let qualityAssuranceChecks = 0;

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
                for (let j = 0; j < events.length; j++) {
                    if (events[j].userId == user.osuId) {
                        nominationResets++;
                    }
                }
            }
        }

        for (let i = 0; i < allQualityAssuranceChecks.length; i++) {
            const event = allQualityAssuranceChecks[i];

            if (event.qualityAssuranceCheckers.includes(user.id)) {
                qualityAssuranceChecks++;
            }
        }

        let deadline;

        for (let i = 0; i < allActiveEvalRounds.length; i++) {
            const evalRound = allActiveEvalRounds[i];

            if (evalRound.bn == user.id) {
                deadline = evalRound.deadline;
                break;
            }
        }

        if (!deadline) deadline = 'Never';

        info.push({
            username: user.username,
            osuId: user.osuId,
            uniqueNominations: uniqueNominations.length,
            nominationResets,
            joinDate: user.bnDuration[user.bnDuration.length - 1],
            nextEvaluation: deadline,
            qualityAssuranceChecks,
        });
    });

    res.json(info);
});

/* POST switch bn evaluator */
router.post('/:id/switchBnEvaluator', api.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && res.locals.userRequest.group != 'nat') {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnEvaluator = !user.isBnEvaluator,
    await user.save();

    res.json(user);
    Logger.generate(req.session.mongoId, `Opted "${user.username}" ${user.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`);
});

module.exports = router;
