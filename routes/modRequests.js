const express = require('express');
const moment = require('moment');
const ModRequest = require('../models/modRequest');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osu = require('../helpers/osu');

const router = express.Router();

/* GET show index */
router.get('/', (req, res) => {
    if (!req.session.mongoId) {
        req.session.lastPage = req.originalUrl;
    }

    res.render('modrequests', {
        layout: false,
    });
});

/* GET show index */
router.get('/relevantInfo', middlewares.isLoggedIn, async (req, res) => {
    const user = res.locals.userRequest;
    const ownRequests = await ModRequest
        .find({ user: user._id })
        .populate({ path: 'user' });
    let requests = [];

    if (user.osuId === 1052994) {
        requests = await ModRequest
            .find({})
            .populate({ path: 'user' });
    }

    res.json({
        ownRequests,
        user,
        requests,
    });
});

/* POST create request */
router.post('/store', middlewares.isLoggedIn, async (req, res) => {
    const { category, link, comment } = req.body;

    util.isValidUrlOrThrow(link, 'https://osu.ppy.sh/beatmapsets/');
    const beatmapsetId = util.getBeatmapsetIdFromUrl(link);
    const cooldown = moment().subtract(1, 'month');
    const hasRequested = await ModRequest.findOne({
        $or: [
            { 'beatmapset.osuId': parseInt(beatmapsetId, 10) },
            { createdAt: { $gte: cooldown.toDate() } },
        ],
    });

    if (hasRequested) {
        return res.json({
            error: 'Already requested within the month',
        });
    }

    const beatmapsetInfo = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);

    if (beatmapsetInfo.user_id != res.locals.userRequest.osuId) {
        return res.json({
            error: 'Cannot submit others people maps.. for now',
        });
    }

    const modes = [...new Set(beatmapsetInfo.beatmaps.map(b => b.mode))];

    const request = new ModRequest();
    request.user = req.session.mongoId;
    request.category = category;
    request.beatmapset = {
        osuId: beatmapsetInfo.id,
        artist: beatmapsetInfo.artist,
        title: beatmapsetInfo.title,
        modes,
        genre: beatmapsetInfo.genre.name,
        language: beatmapsetInfo.language.name,
        numberDiffs: beatmapsetInfo.beatmaps.length,
        length: beatmapsetInfo.beatmaps[0].total_length,
        bpm: beatmapsetInfo.bpm,
        submittedAt: beatmapsetInfo.submitted_date,
    };
    request.comment = comment;
    await request.save();

    res.json({
        success: 'Saved',
    });
});

router.post('/:id/update', middlewares.isLoggedIn, async (req, res) => {
    if (res.locals.userRequest.osuId !== 1052994) {
        return res.json({
            error: 'nope',
        });
    }

    const request = await ModRequest.findById(req.params.id).orFail();
    request.status = req.body.status;
    await request.save();

    res.json({
        success: 'Saved',
        request,
    });
});

module.exports = router;
