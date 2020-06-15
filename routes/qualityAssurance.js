const express = require('express');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');
const Mediation = require('../models/mediation');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

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

/* GET qa listing. */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const [events, overwrite] = await Promise.all([
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
        events,
        overwrite,
    });
});

/* GET load more content */
router.get('/loadMore/:limit/:skip', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const events = await Aiess
        .find({
            eventType: 'Qualified',
            timestamp: { $lte: date },
            hostId: { $exists: true },
        })
        .populate(defaultPopulate)
        .sort({ timestamp: -1 })
        .limit(parseInt(req.params.limit))
        .skip(parseInt(req.params.skip));

    res.json({
        events,
    });
});

/* POST assign user */
router.post('/assignUser/:id', middlewares.isBnOrNat, async (req, res) => {
    const event = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const [outDated, bubble] = await Promise.all([
        Aiess
            .findOne({
                beatmapsetId: event.beatmapsetId,
                $or: [
                    { eventType: 'Disqualified' },
                    { eventType: 'Ranked' },
                ],
                timestamp: { $gte: event.timestamp },
            })
            .sort({ timestamp: -1 }),

        Aiess
            .findOne({
                beatmapsetId: event.beatmapsetId,
                eventType: 'Bubbled',
            })
            .sort({ timestamp: -1 }),
    ]);

    if (outDated || event.qualityAssuranceCheckers.length > (event.modes.length * 2 - 1)) {
        return res.json({ error: 'Outdated' });
    }

    if (event.userId == req.session.osuId || bubble.userId == req.session.osuId) {
        return res.json({ error: 'You cannot check your nominations!' });
    }

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

    res.json(newEvent);

    Logger.generate(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${newEvent.beatmapsetId}`
    );
});

/* POST unassign user */
router.post('/unassignUser/:id', middlewares.isBnOrNat, async (req, res) => {
    const event = await Aiess
        .findByIdAndUpdate(req.params.id, { $pull: { qualityAssuranceCheckers: req.session.mongoId } })
        .populate(defaultPopulate);

    res.json(event);

    Logger.generate(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${event.beatmapsetId}`
    );
});

/* POST unassign user */
router.post('/editComment/:id', middlewares.isBnOrNat, async (req, res) => {
    let mediation;

    if (req.body.mediationId) {
        mediation = await Mediation.findById(req.body.mediationId);
    } else {
        mediation = await Mediation.create({ mediator: req.session.mongoId });
        await Aiess.findByIdAndUpdate(req.params.id, { $push: { qualityAssuranceComments: mediation } });
    }

    await Mediation.findByIdAndUpdate(mediation._id, { comment: req.body.comment });

    const event = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(event);
});

module.exports = router;
