const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const util = require('../../helpers/util');
const middlewares = require('../../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

// population
const defaultAppPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natBuddy', select: 'username osuId groups' },
    { path: 'bnEvaluators', select: 'username osuId groups' },
    { path: 'natEvaluators', select: 'username osuId groups' },
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

/* GET public evals */
router.get('/relevantInfo/:limit', async (req, res) => {
    const limit = parseInt(req.params.limit);
    const isNat = res.locals.userRequest.isNat;
    let applicationsJson = [];

    let applications = await AppEvaluation
        .find({
            active: false,
            consensus: { $exists: true },
            isPublic: true,
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

    for (let app of applications) {
        // JSON-ify the object to modify it directly because we can't exclude ids from population (and we need to, for security reasons)
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

    res.json({
        applications: applicationsJson,
    });
});

/* GET specific public eval */
router.get('/search/:id', async (req, res) => {
    const id = req.params.id;
    const isNat = res.locals.userRequest.isNat;

    let app = await AppEvaluation.findOne({
        _id: id,
        active: false,
        consensus: { $exists: true },
        isPublic: true,
    }).populate(defaultAppPopulate);
    
    // JSON-ify the object to modify it directly because we can't exclude ids from population (and we need to, for security reasons)
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

    res.json({
        application: app,
    });
});

module.exports = router;
