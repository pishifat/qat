const express = require('express');
const middlewares = require('../helpers/middlewares');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const BnEvaluation = require('../models/evaluations/bnEvaluation');

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

/* GET evaluation results by ID */
router.get('/evaluation/:id', async (req, res) => {
    let evaluation;

    evaluation = await AppEvaluation.findById(req.params.id).populate(appPopulate);
    if (!evaluation) evaluation = await BnEvaluation.findById(req.params.id).populate(bnEvalPopulate);

    return res.json(evaluation);
});

module.exports = router;
