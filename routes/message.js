const express = require('express');
const middlewares = require('../helpers/middlewares');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Evaluation = require('../models/evaluations/evaluation');
const Report = require('../models/report');
const Veto = require('../models/veto');

const router = express.Router();

router.use(middlewares.isLoggedIn);

//population
const appPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
];

const bnEvalPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
];

const reportPopulate = [
    { path: 'culprit', select: 'username osuId' },
    { path: 'reporter', select: 'username osuId' },
];

/* GET evaluation results by ID */
router.get('/evaluation/:id', async (req, res) => {
    let query;

    if (res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat) query = { _id: req.params.id };
    else query = { _id: req.params.id, active: false };

    let evaluation;

    evaluation = await AppEvaluation.findOne(query).populate(appPopulate);
    if (!evaluation) evaluation = await Evaluation.findOne(query).populate(bnEvalPopulate);

    return res.json(evaluation);
});

/* GET report by ID */
router.get('/report/:id', async (req, res) => {
    return res.json(await Report.findById(req.params.id).populate(reportPopulate));
});

/* GET veto by ID */
router.get('/veto/:id', async (req, res) => {
    const veto = await Veto.findById(req.params.id);

    return res.json(veto);
});

module.exports = router;
