const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
const User = require('../../models/user');
const middlewares = require('../../helpers/middlewares');
const util = require('../../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);

// population
const defaultAppPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natBuddy', select: 'username osuId groups' },
    {
        path: 'reviews',
        select: 'moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

const defaultBnPopulate = [
    { path: 'user', select: 'username osuId modesInfo groups' },
    {
        path: 'reviews',
        select: 'moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
    
];

function sanitizeReviews(reviews) {
    return reviews.map(review => {
        return {
            evaluator: {
                username: review.evaluator.username,
                osuId: review.evaluator.osuId,
                groups: review.evaluator.groups,
                isTrialNat: review.evaluator.isTrialNat,
            },
            moddingComment: review.moddingComment,
            vote: review.vote,
            id: review.id,
            _id: review._id,
        };
    });
}

function sanitizePublicReviews(reviews) {
    return reviews.map(review => {
        return {
            evaluator: {
                isTrialNat: review.evaluator.isTrialNat,
                groups: review.evaluator.groups,
            },
            moddingComment: review.moddingComment,
            vote: review.vote,
            id: review.id,
            _id: review._id,
        };
    });
}

function sanitizeBareboneReviews(reviews) {
    return reviews.map(review => {
        return {
            id: review.id,
            _id: review._id,
        }
    });
}

/* GET search for your evals */
router.get('/search', async (req, res) => {
    const userToSearch = req.session.osuId;
    const idToSearch = req.query.id;
    const isNat = res.locals.userRequest.isNat;

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

    // JSON-ify applications to modify them directly because we can't exclude review ids from population in certain cases (and we need to, for security reasons)
    let applicationsJson = [];

    for (let app of bnApplications) {
        app = app.toObject();

        // add an evaluators array to the application object which contains each reviewer's username and osuId
        app.evaluators = app.reviews.map(review => {
            return {
                username: review.evaluator.username,
                osuId: review.evaluator.osuId,
                groups: review.evaluator.groups,
            };
        });

        if (isNat) {
            app.reviews = sanitizeReviews(app.reviews);
        } else if (app.isNewEvaluationFormat) {
            app.reviews = sanitizePublicReviews(app.reviews);
        } else {
            app.reviews = sanitizeBareboneReviews(app.reviews);
        }

        // shuffle the reviews array for non-NATs
        if (!isNat) app.reviews = util.shuffleArray(app.reviews);

        applicationsJson.push(app);
    }

    // JSON-ify bn apps for the same reason above
    let evaluationsJson = [];

    for (let eval of evaluations) {
        eval = eval.toObject();

        eval.evaluators = eval.reviews.map(review => {
            return {
                username: review.evaluator.username,
                osuId: review.evaluator.osuId,
                groups: review.evaluator.groups,
            };
        });

        if (isNat) {
            eval.reviews = sanitizeReviews(eval.reviews);
        } else {
            eval.reviews = sanitizeBareboneReviews(eval.reviews);
        }

        evaluationsJson.push(eval);
    }

    res.json({
        bnApplications: applicationsJson,
        evaluations: evaluationsJson,
    });
});

module.exports = router;
