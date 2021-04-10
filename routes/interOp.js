const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');
const User = require('../models/user');
const QualityAssuranceCheck = require('../models/qualityAssuranceCheck');
const Log = require('../models/log');
const Evaluation = require('../models/evaluations/evaluation');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const getGeneralEvents = require('./evaluations/bnEval').getGeneralEvents;
const { BnEvaluationConsensus } = require('../shared/enums');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('secret');
    const username = req.header('username');

    if (!secret || !username || config.interOpAccess[username].secret !== secret) {
        return res.status(401).send('Invalid key');
    }

    Logger.generate(
        config.interOpAccess[username].mongoId,
        `accessed /interOp${req.url}`,
        'interOp'
    );

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
        await QualityAssuranceCheck
            .find({ user: user.id })
            .populate({ path: 'event ' })
            .sort({ timestamp: 1 })
    );
});


/* GET all recent QA info */
router.get('/qaInfo/', async (req, res) => {
    const populate = [
        {
            path: 'qualityAssuranceChecks',
            populate: {
                path: 'user',
                select: 'username osuId',
            },
        },
    ];

    let date = new Date();
    date.setDate(date.getDate() - 7);

    const [events, overwrite] = await Promise.all([
        Aiess
            .find({
                type: 'qualify',
                timestamp: { $gte: date },
            })
            .populate(populate)
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                $or: [
                    { type: 'disqualify' },
                    { type: 'rank' },
                ],
                timestamp: { $gte: date },
            })
            .populate(populate)
            .sort({ timestamp: -1 }),
    ]);

    res.json({
        events,
        overwrite,
    });
});

/* GET dq info for discussionID */
router.get('/dqInfoByDiscussionId/:discussionId', async (req, res) => {
    res.json(await Aiess.findOne({ discussionId: req.params.discussionId }));
});

/* GET activity by user and days */
router.get('/nominationResets/:osuId/:days/', async (req, res) => {
    const user = await User.findOne({ osuId: req.params.osuId });

    if (!user) {
        return res.status(404).send('User not found');
    }

    let days = parseInt(req.params.days);
    if (isNaN(days)) days = 90;
    else if (days > 1000) days = 999;
    else if (days < 2) days = 2;

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date();

    res.json(await getGeneralEvents(user.osuId, user.id, user.modes, minDate, maxDate));
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

/* GET all of a user's logs */
router.get('/logs/:osuId/:category', async (req, res) => {
    const user = await User.findOne({ osuId: req.params.osuId });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const logs = await Log
        .find({
            user: user._id,
            category: req.params.category,
        })
        .sort({ $natural: -1 });

    if (!logs || !logs.length) {
        return res.status(404).send(
            `User has no ${req.params.category} logs. Be sure your category is one of the following: 
            'account',
            'user',
            'application',
            'appEvaluation',
            'bnEvaluation',
            'dataCollection',
            'discussionVote',
            'report',
            'test',
            'qualityAssurance',
            'veto'`
        );
    }

    res.json(logs);
});

/* GET events created/updated after date */
router.get('/eventsByDate/:date', async (req, res) => {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
        return res.status(404).send('Invalid date');
    }

    const logs = await Log
        .find({
            createdAt: { $gt: date },
            category: 'dataCollection',
        })
        .populate([
            { path: 'user', select: 'username osuId' },
            { path: 'relatedId', select: 'obviousness severity discussionId' },
        ])
        .sort({ createdAt: -1 });

    res.json(logs);
});

module.exports = router;
