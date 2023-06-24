const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const QualityAssuranceCheck = require('../models/qualityAssuranceCheck');
const Log = require('../models/log');
const Evaluation = require('../models/evaluations/evaluation');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Review = require('../models/evaluations/review');
const getGeneralEvents = require('./evaluations/bnEval').getGeneralEvents;
const { BnEvaluationConsensus } = require('../shared/enums');
const middlewares = require('../helpers/middlewares');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('secret');
    const username = req.header('username');
    const isWs = req.header('Upgrade');

    if (!secret || !username || config.interOpAccess[username].secret !== secret) {
        if (isWs != "websocket") return res.status(401).send('Invalid key');
    }

    return next();
});

// establish evaluation population
const evaluationPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    { 
        path: 'natEvaluatorHistory', 
        select: 'user previousUser',
        populate: {
            path: 'user previousUser',
            select: 'username osuId groups isTrialNat',
        }
    
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

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
    res.json(await User.findOne({ osuId: parseInt(req.params.osuId) }));
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
                timestamp: { $gt: date },
            })
            .populate(populate)
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                $or: [
                    { type: 'disqualify' },
                    { type: 'rank' },
                ],
                timestamp: { $gt: date },
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
    res.json(await Aiess.findOne({ discussionId: parseInt(req.params.discussionId) }));
});

/* GET activity by user and days */
router.get('/nominationResets/:osuId/:days/', async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });

    if (!user) {
        return res.status(404).send('User not found');
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


/* sensitive data */

/* GET latest evaluation or appevaluation */
router.get('/latestEvaluation/:osuId', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });

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
router.get('/bnRemoval/:osuId', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });

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

    let action = latestEvaluation.isResignation ? 'Resigned' : latestEvaluation.consensus === BnEvaluationConsensus.FullBn ? 'Full BN' : latestEvaluation.consensus === BnEvaluationConsensus.ProbationBn ? 'Moved to Probation BN' : 'Kicked'

    if (action === 'Kicked' || action === 'Moved to Probation BN') {
        switch (latestEvaluation.addition) {
            case "lowActivityWarning":
                action += ' for poor activity';
                break;
            case "behaviorWarning":
                action += ' for poor behavior';
                break;
            case "mapQualityWarning":
                action += ' for poor map quality';
                break;
            case "moddingQualityWarning":
                action += ' for poor modding quality';
                break;
            default:
                break;
        }
    } else if (action === 'Full BN') {
        switch (latestEvaluation.addition) {
            case "lowActivityWarning":
                action += ' + low activity warning';
                break;
            case "behaviorWarning":
                action += ' + behavior warning';
                break;
            case "mapQualityWarning":
                action += ' + map quality warning';
                break;
            case "moddingQualityWarning":
                action += ' + modding quality warning';
                break;
            default:
                break;
        }
    } else if (action === 'Resigned') {
        switch (latestEvaluation.consensus) {
            case "resignedOnGoodTerms":
                action += ' on good terms';
                break;
            case "resignedOnStandardTerms":
                action += ' on standard terms';
                break;
            default:
                break;
        }
    }

    res.json({
        action: action,
        timestamp: latestEvaluation.archivedAt,
    } );
});

/* GET all of a user's logs */
router.get('/logs/:osuId/:category', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });

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
            'veto',
            'spam',
            'bnFinder'`
        );
    }

    res.json(logs);
});

/* GET a user's submitted evaluations */
router.get('/submittedEvaluations/:osuId/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });
    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send('User not found');
    }

    if (isNaN(days)) {
        return res.status(404).send('Invalid days count');
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
router.get('/assignedEvaluations/:osuId/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });
    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send('User not found');
    }

    if (isNaN(days)) {
        return res.status(404).send('Invalid days count');
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

/* GET a user's previously assigned evaluations */
router.get('/previouslyAssignedEvaluations/:osuId/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findOne({ osuId: parseInt(req.params.osuId) });
    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send('User not found');
    }

    if (isNaN(days)) {
        return res.status(404).send('Invalid days count');
    }

    let date = new Date();
    date.setDate(date.getDate() - days);

    // find assigned evaluations (including those that were re-rolled)
    const previouslyAssignedApps = await AppEvaluation
        .find({
            'natEvaluatorHistory.previousUser': user._id,
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

    const previouslyAssignedEvaluations = await Evaluation
        .find({
            'natEvaluatorHistory.previousUser': user._id,
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
        previouslyAssignedApps: previouslyAssignedApps,
        previouslyAssignedEvaluations: previouslyAssignedEvaluations,
    });
});

module.exports = router;
