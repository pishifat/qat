const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Evaluation = require('../models/evaluations/evaluation');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const { BnEvaluationConsensus } = require('../shared/enums');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('Qat-Key');

    if (!secret || config.interOpSecret !== secret)
        return res.status(401).send('Invalid key');

    return next();
});


/* GET users in BN/NAT */
router.get('/users', async (_, res) => {
    res.json(await User.find({ groups: { $in: ['bn', 'nat'] } }));
});

/* GET users in or previously in BN/NAT */
router.get('/users/all', async (_, res) => {
    res.json(
        await User.find({
            $or: [
                { history: { $ne: [], $exists: true } },
            ],
        })
    );
});

/* GET specific user info */
router.get('/users/:osuId', async (req, res) => {
    res.json(await User.findOne({ osuId: req.params.osuId }));
});

/* GET events for beatmapsetID */
router.get('/events/:beatmapsetId', async (req, res) => {
    res.json(
        await Aiess
            .find({ beatmapsetId: req.params.beatmapsetId })
            .populate([
                { path: 'qualityAssuranceCheckers', select: 'osuId username' },
                { path: 'qualityAssuranceComments', populate: { path: 'mediator', select: 'osuId username' } },
            ])
            .sort({ timestamp: 1 })
    );
});

/* GET quality assurance events by user osu! ID */
router.get('/qaEventsByUser/:osuId', async (req, res) => {
    let user = await User.findOne({ osuId: parseInt(req.params.osuId) });

    if (!user) {
        return res.status(404).send('User not found');
    }

    res.json(
        await Aiess
            .find({ qualityAssuranceCheckers: user.id })
            .populate([
                { path: 'qualityAssuranceCheckers', select: 'osuId username' },
                { path: 'qualityAssuranceComments', populate: { path: 'mediator', select: 'osuId username' } },
            ])
            .sort({ timestamp: 1 })
    );
});

/* GET dq info for discussionID */
router.get('/dqInfoByDiscussionId/:discussionId', async (req, res) => {
    res.json(await Aiess.findOne({ discussionId: req.params.discussionId }));
});

/* GET latest evaluation or appevaluation */
router.get('/latestEvaluation/:osuId', async (req, res) => {
    const user = await User.findOne({ osuId: req.params.osuId });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const latestEvaluation = await Evaluation
        .findOne(
            {
                user: user._id,
                $or: [
                    { consensus: { $exists: true } },
                    { kind: 'resignation' },
                ],
            },
            {
                feedback: 0,
            })
        .sort({ updatedAt: -1 });

    const latestAppEvaluation = await AppEvaluation
        .findOne(
            {
                user: user._id,
                consensus: { $exists: true },
            },
            {
                feedback: 0,
            })
        .sort({ updatedAt: -1 });

    if (!latestEvaluation && !latestAppEvaluation) {
        return res.status(404).send('User has no recent BN evaluation logged');
    }

    let evaluation;

    if (latestEvaluation && latestAppEvaluation) {
        console.log(latestEvaluation.updatedAt);
        console.log(latestAppEvaluation.updatedAt);

        if (latestEvaluation.updatedAt > latestAppEvaluation.updatedAt) {
            evaluation = latestEvaluation;
        } else {
            evaluation = latestAppEvaluation;
        }
    } else if (latestEvaluation) {
        evaluation = latestEvaluation;
    } else if (latestAppEvaluation) {
        evaluation = latestAppEvaluation;
    }

    res.json(evaluation);
});

/* GET general reason for BN removal */
router.get('/bnRemoval/:osuId', async (req, res) => {
    const user = await User.findOne({ osuId: req.params.osuId });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const latestEvaluation = await Evaluation
        .findOne({
            user: user._id,
            active: false,
            consensus: { $exists: true },
        })
        .sort({ $natural: -1 });

    if (!latestEvaluation) {
        return res.status(404).send('User has no BN removal logged');
    }

    res.json({
        action: latestEvaluation.isResignation ? 'Resigned' : latestEvaluation.consensus === BnEvaluationConsensus.FullBn ? 'Moved to Full BN' : latestEvaluation.consensus === BnEvaluationConsensus.ProbationBn ? 'Moved to Probation BN' : 'Kicked',
        timestamp: latestEvaluation.archivedAt,
    } );
});

module.exports = router;
