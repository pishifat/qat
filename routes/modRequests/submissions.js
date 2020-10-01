const express = require('express');
const moment = require('moment');
const ModRequest = require('../../models/modRequests/modRequest');
const Beatmapset = require('../../models/modRequests/beatmapset');
const middlewares = require('../../helpers/middlewares');
const util = require('../../helpers/util');
const osu = require('../../helpers/osu');

function getGenreName (id) {
    // note that there's no 8, 11, 12
    switch (id) {
        case 0:
            return 'any';
        case 1:
            return 'unspecified';
        case 2:
            return 'video game';
        case 3:
            return 'anime';
        case 4:
            return 'rock';
        case 5:
            return 'pop';
        case 6:
            return 'other';
        case 7:
            return 'novelty';
        case 9:
            return 'hip hop';
        case 10:
            return 'electronic';
        case 13:
            return 'folk';
        default:
            return 'unknown';
    }
}

function getLanguageName (id) {
    switch (id) {
        case 0:
            return 'any';
        case 1:
            return 'other';
        case 2:
            return 'english';
        case 3:
            return 'japanese';
        case 4:
            return 'chinese';
        case 5:
            return 'instrumental';
        case 6:
            return 'korean';
        case 7:
            return 'french';
        case 8:
            return 'german';
        case 9:
            return 'swedish';
        case 10:
            return 'spanish';
        case 11:
            return 'italian';
        default:
            return 'unknown';
    }
}

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

/* GET own created requests */
router.get('/owned', middlewares.isLoggedIn, async (req, res) => {
    const user = res.locals.userRequest;
    const ownRequests = await ModRequest
        .find({ user: user._id })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({
        ownRequests,
        user,
    });
});

/* POST create request */
router.post('/store', middlewares.isLoggedIn, async (req, res) => {
    const { category, link, comment } = req.body;

    util.isValidUrlOrThrow(link, 'https://osu.ppy.sh/beatmapsets/');
    const beatmapsetId = util.getBeatmapsetIdFromUrl(link);

    const cooldown = moment().subtract(2, 'month');
    const [hasRequested, beatmapsetRequested] = await Promise.all([
        ModRequest.findOne({
            user: req.session.mongoId,
            createdAt: { $gte: cooldown.toDate() },
        }),
        Beatmapset.findOne({ osuId: parseInt(beatmapsetId, 10) }),
    ]);

    if (hasRequested || beatmapsetRequested) {
        return res.json({
            error: 'You can only request one beatmap every 2 months!',
        });
    }

    const beatmapsetInfo = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);

    if (!beatmapsetInfo || beatmapsetInfo.error || !beatmapsetInfo.id) {
        return res.json({
            error: `Couldn't retrieve beatmap info`,
        });
    }

    // 4 = loved, 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
    if (beatmapsetInfo.ranked > 0) {
        return res.json({
            error: `Cannot submit ranked maps`,
        });
    }

    if (beatmapsetInfo.user_id != res.locals.userRequest.osuId) {
        return res.json({
            error: `Cannot submit others people's maps`,
        });
    }

    const modes = [...new Set(beatmapsetInfo.beatmaps.map(b => b.mode))];

    const beatmapset = new Beatmapset();
    beatmapset.osuId = beatmapsetInfo.id;
    beatmapset.artist = beatmapsetInfo.artist;
    beatmapset.title = beatmapsetInfo.title;
    beatmapset.modes = modes;
    beatmapset.genre = getGenreName(beatmapsetInfo.genre.id);
    beatmapset.language = getLanguageName(beatmapsetInfo.language.id);
    beatmapset.numberDiffs = beatmapsetInfo.beatmaps.length;
    beatmapset.length = beatmapsetInfo.beatmaps[0].total_length;
    beatmapset.bpm = beatmapsetInfo.bpm;
    beatmapset.submittedAt = beatmapsetInfo.submitted_date;

    const request = new ModRequest();
    request.user = req.session.mongoId;
    request.category = category;
    request.beatmapset = beatmapset;
    request.comment = comment;

    await Promise.all([
        beatmapset.validate(),
        request.validate(),
    ]);

    await Promise.all([
        beatmapset.save(),
        request.save(),
    ]);

    res.json({
        success: 'Saved',
    });
});

module.exports = router;
