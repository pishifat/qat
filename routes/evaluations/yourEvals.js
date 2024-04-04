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
];

const defaultBnPopulate = [
    { path: 'user', select: 'username osuId modesInfo' },
    
];

/* GET search for your evals */
router.get('/search', async (req, res) => {
    const userToSearch = req.session.osuId;
    const idToSearch = req.query.id;
    
    if (res.locals.userRequest.isNat) {
        const reviewsPopulate = {
            path: 'reviews',
            select: 'evaluator behaviorComment moddingComment vote',
            populate: {
                path: 'evaluator',
                select: 'username osuId groups',
            },
        };

        defaultAppPopulate.push(reviewsPopulate);
        defaultBnPopulate.push(reviewsPopulate);
    }

    let bnApplicationsQuery = AppEvaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: -1 });

    let bnEvaluationsQuery = Evaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultBnPopulate)
        .sort({ createdAt: -1 });

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
