const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
const User = require('../../models/user');
const middlewares = require('../../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

// population
const defaultAppPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
];

const defaultBnPopulate = [
    {
        path: 'user',
        select: 'username osuId modesInfo',
    },
    {
        path: 'natEvaluators',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
];

/* GET search for your evals */
router.get('/search', async (req, res) => {
    const userToSearch = req.session.osuId;
    const idToSearch = req.query.id;

    let limit = parseInt(req.query.limit) || 12;

    let bnApplicationsQuery = AppEvaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

    let bnEvaluationsQuery = Evaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultBnPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

        if (idToSearch) {
            bnApplicationsQuery.where('_id', idToSearch);
            bnEvaluationsQuery.where('_id', idToSearch);
        } else {
            const user = await User.findByUsernameOrOsuId(userToSearch);

            if (!user) {
                return res.json({ error: 'Cannot find user!' });
            }

            bnApplicationsQuery.where('user', user.id);
            bnEvaluationsQuery.where('user', user.id);
    } 

    const [bnApplications, evaluations] = await Promise.all([
        bnApplicationsQuery,
        bnEvaluationsQuery,
    ]);

    res.json({
        bnApplications,
        evaluations,
    });
});

module.exports = router;
