const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Log = require('../models/log');
const Evaluation = require('../models/evaluations/evaluation');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Review = require('../models/evaluations/review');
const getGeneralEvents = require('./evaluations/bnEval').getGeneralEvents;
const middlewares = require('../helpers/middlewares');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Discussion = require('../models/discussion');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('secret');
    const username = req.header('username');
    const isWs = req.header('Upgrade');

    if (!secret || !username || config.interOpAccess[username].secret !== secret) {
        if (isWs != "websocket") return res.status(401).send({ error: 'Invalid credentials' });
    }

    return next();
});

// establish evaluation population
const evaluationPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

/* GET test endpoint */
router.get('/', (req, res) => {
    res.status(200).send({ response: 'Connected', username: req.header('username') });
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
router.get('/users/:userInput', async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        res.status(404).send({ error: 'User not found' });
    }

    res.json(user);
});

/* GET events for beatmapsetID */
router.get('/events/:beatmapsetId', async (req, res) => {
    res.json(
        await Aiess
            .find({ beatmapsetId: parseInt(req.params.beatmapsetId) })
            .sort({ timestamp: 1 })
    );
});

/* GET quality assurance events by user osu! ID */
// ! Deprecated
router.get('/qaEventsByUser/:osuId', async (req, res) => {
    res.status(410).send({ error: 'This endpoint is deprecated' });
});

/* GET all recent QA info */
// ! Deprecated
router.get('/qaInfo/', async (req, res) => {
    res.status(410).send({ error: 'This endpoint is deprecated' });
});

/* GET dq info for discussionID */
router.get('/dqInfoByDiscussionId/:discussionId', async (req, res) => {
    res.json(await Aiess.findOne({ discussionId: parseInt(req.params.discussionId) }));
});

/* GET activity by user and days */
router.get('/nominationResets/:userInput/:days/', async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    let days = parseInt(req.params.days);
    if (isNaN(days)) days = 90;
    else if (days > 10000) days = 9999;
    else if (days < 2) days = 2;

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date();

    res.json(await getGeneralEvents(user.osuId, user.id, user.modes, minDate, maxDate));
});

/* GET events created/updated after date */
router.get('/eventsByDate/:date', async (req, res) => {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
        return res.status(404).send({ error: 'Invalid date' });
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

/* GET content review */
router.get('/contentReview/:limit', async (req, res) => {
    let limit = parseInt(req.params.limit);
    
    if (isNaN(limit)) {
        return res.status(404).send({ error: 'Invalid limit' });
    }

    if (limit > 100) {
        limit = 100;
    }
    res.json(
        await Discussion
            .find({
                isNatOnly: false,
                mode: 'all',
                discussionLink: { $exists: true },
                title: { $regex: 'Content review' },
            })
            .limit(limit)
            .select('discussionLink shortReason title')
            .sort({ createdAt: -1 }),
    );
});

// ! NAT-only endpoints

/* GET latest evaluation or appevaluation */
router.get('/latestEvaluation/:userInput', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
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
        return res.status(404).send({ error: 'User has no recent BN evaluation logged' });
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
router.get('/bnRemoval/:userInput', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const latestEvaluation = await Evaluation
        .findOne({
            user: user._id,
            active: false,
            consensus: { $exists: true },
        })
        .sort({ $natural: -1 });

    if (!latestEvaluation) {
        return res.status(404).send({ error: 'User has no BN removal logged' });
    }

    const action = latestEvaluation.isResignation ? 'resign' : latestEvaluation.consensus;
    const addition = action === 'resign' ? latestEvaluation.consensus : latestEvaluation.addition;

    res.json({
        action,
        addition,
        timestamp: latestEvaluation.archivedAt,
    } );
});

/* GET all of a user's logs */
router.get('/logs/:userInput/:category', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const logs = await Log
        .find({
            user: user._id,
            category: req.params.category,
        })
        .sort({ $natural: -1 });

    if (!logs || !logs.length) {
        return res.status(404).send({
            error: `User has no ${req.params.category} logs. Be sure your category is one of the following: 
            'account',
            'user',
            'application',
            'appEvaluation',
            'bnEvaluation',
            'dataCollection',
            'discussionVote',
            'report',
            'test', (no longer used)
            'qualityAssurance',
            'veto',
            'spam',
            'bnFinder' (no longer used),
            'notableNameChanges',
            'documentation'`,
        });
    }

    res.json(logs);
});

/* GET a user's submitted evaluations */
router.get('/submittedEvaluations/:userInput/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);
    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    if (isNaN(days)) {
        return res.status(404).send({ error: 'Invalid days count' });
    }
    
    let date = new Date();
    date.setDate(date.getDate() - days);

    // find submitted evaluations
    const submittedEvaluations = [];

    const reviews = await Review
        .find({
            evaluator: user._id,
            createdAt: { $gt: date },
        });

    for (const review of reviews) {
        let evaluation;
        
        // check for app
        evaluation = await AppEvaluation
            .findOne({
                reviews: review._id,
            })
            .populate(evaluationPopulate);

        if (!evaluation) {
            evaluation = await BnEvaluation
            .findOne({
                reviews: review._id,
            })
            .populate(evaluationPopulate);
        }

        submittedEvaluations.push(evaluation);
    }

    res.json(submittedEvaluations);
});

/* GET a user's assigned evaluations */
router.get('/assignedEvaluations/:userInput/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    if (isNaN(days)) {
        return res.status(404).send({ error: 'Invalid days count' });
    }

    let date = new Date();
    date.setDate(date.getDate() - days);

    // find assigned evaluations (regardless of whether or not they were acted upon)
    const assignedApplications = await AppEvaluation
        .find({
            natEvaluators: user._id,
            $or: [
                { active: true },
                { 
                    active: false,
                    consensus: {$exists: true }
                }
            ],
            createdAt: { $gt: date },
        })
        .populate(evaluationPopulate);
    
    const assignedEvaluations = await Evaluation
        .find({
            natEvaluators: user._id,
            $or: [
                { active: true },
                { 
                    active: false,
                    consensus: {$exists: true }
                }
            ],
            createdAt: { $gt: date },
        })
        .populate(evaluationPopulate);

    res.json({
        assignedApplications: assignedApplications,
        assignedEvaluations: assignedEvaluations,
    })
});

module.exports = router;
