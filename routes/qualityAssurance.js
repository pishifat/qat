const express = require('express');
const api = require('../helpers/api');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');
const Mediation = require('../models/mediation');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('qualityassurance', {
        title: 'Quality Assurance',
        script: '../javascripts/qualityAssurance.js',
        isQualityAssurance: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

const defaultPopulate = [
    { path: 'qualityAssuranceCheckers', select: 'username osuId' },
    {
        path: 'qualityAssuranceComments',
        populate: {
            path: 'mediator',
            select: 'username osuId id',
        },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const [data, overwrite] = await Promise.all([
        Aiess
            .find({
                eventType: 'Qualified',
                timestamp: { $gte: date },
            })
            .populate(defaultPopulate)
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                $or: [
                    { eventType: 'Disqualified' },
                    { eventType: 'Ranked' },
                ],
                timestamp: { $gte: date },
            })
            .populate(defaultPopulate)
            .sort({ timestamp: -1 }),
    ]);
    res.json({
        maps: data,
        overwrite,
        userId: res.locals.userRequest.id,
        userOsuId: res.locals.userRequest.osuId,
        username: res.locals.userRequest.username,
        isNat: res.locals.userRequest.isNat,
        mode: res.locals.userRequest.modes[0] || 'osu',
    });
});

/* GET load more content */
router.get('/loadMore/:limit/:skip', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const data = await Aiess
        .find({
            eventType: 'Qualified',
            timestamp: { $lte: date },
            hostId: { $exists: true },
        })
        .populate(defaultPopulate)
        .sort({ timestamp: -1 })
        .limit(parseInt(req.params.limit))
        .skip(parseInt(req.params.skip));

    res.json({ maps: data });
});

/* POST assign user */
router.post('/assignUser/:id', api.isBnOrNat, async (req, res) => {
    const event = await Aiess.findById(req.params.id).populate(defaultPopulate);
    const bubble =
        await Aiess
            .findOne({
                beatmapsetId: event.beatmapsetId,
                eventType: 'Bubbled',
            })
            .sort({ timestamp: -1 });

    if (event.userId == req.session.osuId || bubble.userId == req.session.osuId) {
        return res.json({ error: 'You cannot check your nominations!' });
    }

    // find event, previous bubble, and any previous qualifications. if bubble comes before any previous qualifications, pass. if not, fail.

    let validMode;

    for (let i = 0; i < res.locals.userRequest.modes.length; i++) {
        const mode = res.locals.userRequest.modes[i];

        if (event.modes.includes(mode)) {
            validMode = true;
            break;
        }
    }

    if (!validMode) {
        return res.json({ error: 'You are not qualified for this game mode!' });
    }

    let probation;

    for (let i = 0; i < res.locals.userRequest.probation.length; i++) {
        const mode = res.locals.userRequest.probation[i];

        if (event.modes.includes(mode)) {
            probation = true;
            break;
        }
    }

    if (probation) {
        return res.json({ error: 'Probation users cannot do this!' });
    }

    const newEvent = await Aiess
        .findByIdAndUpdate(req.params.id, { $push: { qualityAssuranceCheckers: req.session.mongoId } })
        .populate(defaultPopulate);

    res.json(newEvent.qualityAssuranceCheckers);

    Logger.generate(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${newEvent.beatmapsetId}`
    );
});

/* POST unassign user */
router.post('/unassignUser/:id', api.isBnOrNat, async (req, res) => {
    let event = await Aiess
        .findByIdAndUpdate(req.params.id, { $pull: { qualityAssuranceCheckers: req.session.mongoId } })
        .populate(defaultPopulate);

    res.json(event.qualityAssuranceCheckers);

    Logger.generate(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${event.beatmapsetId}`
    );
});

/* POST unassign user */
router.post('/editComment/:id', api.isBnOrNat, async (req, res) => {
    let mediation;

    if (req.body.mediationId) {
        mediation = await Mediation.findById(req.body.mediationId);
    } else {
        mediation = await Mediation.create({ mediator: req.session.mongoId });
        await Aiess.findByIdAndUpdate(req.params.id, { $push: { qualityAssuranceComments: mediation } });
    }

    await Mediation.findByIdAndUpdate(mediation._id, { comment: req.body.comment });

    let event = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(event.qualityAssuranceComments);
});

module.exports = router;
