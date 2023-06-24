const express = require('express');
const moment = require('moment');
const ModRequest = require('../../models/modRequests/modRequest');
const ModReview = require('../../models/modRequests/modReview');
const middlewares = require('../../helpers/middlewares');

const defaultPopulate = [
    {
        path: 'beatmapset',
        populate: {
            path: 'events',
        },
    },
    {
        path: 'user',
        select: 'osuId username groups rankedBeatmapsets',
    },
    {
        path: 'modReviews',
        populate: {
            path: 'user',
            select: 'osuId username groups',
        },
    },
];

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasBasicAccess);

/* GET all requests */
router.get('/all', async (req, res) => {
    const months = req.query.limit || 1;
    const maxDate = moment().subtract(months, 'month');
    const requests = await ModRequest
        .find({ createdAt: { $gt: maxDate.toDate() } })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({
        requests,
    });
});

/* GET requests that the user reviewed  */
router.get('/involved', async (req, res) => {
    const user = res.locals.userRequest;
    const reviews = await ModReview
        .find({ user: user._id })
        .sort({ createdAt: -1 });

    const requestIds = reviews.map(r => r.modRequest);
    const involvedRequests = await ModRequest
        .find({ _id: { $in: requestIds } })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({
        involvedRequests,
    });
});

router.post('/:id/review', middlewares.isBnOrNat, async (req, res) => {
    let [review, modRequest] = await Promise.all([
        ModReview.findOne({
            modRequest: req.params.id,
            user: req.session.mongoId,
        }),
        ModRequest.findById(req.params.id),
    ]);

    if (modRequest.user.toString() == req.session.mongoId) {
        return res.json({
            error: 'Cannot review your own maps!',
        });
    }

    if (!review) {
        review = new ModReview();
        review.modRequest = req.params.id;
        review.user = req.session.mongoId;
    }

    review.action = req.body.action;
    review.comment = req.body.comment;
    await review.save();

    res.json({
        success: 'Saved',
    });
});

module.exports = router;
