const express = require('express');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');
const Mediation = require('../models/mediation');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const defaultPopulate = [
    { path: 'qualityAssuranceCheckers', select: 'username osuId modesInfo' },
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
                type: 'qualify',
                timestamp: { $gte: date },
            })
            .populate(defaultPopulate)
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                $or: [
                    { type: 'disqualify' },
                    { type: 'rank' },
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
            type: 'qualify',
            timestamp: { $lte: date },
            creatorId: { $exists: true },
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
                    { type: 'disqualify' },
                    { type: 'rank' },
                ],
                timestamp: { $gte: event.timestamp },
            })
            .sort({ timestamp: -1 }),

        Aiess
            .findOne({
                beatmapsetId: event.beatmapsetId,
                type: 'nominate',
            })
            .sort({ timestamp: -1 }),
    ]);

    if (outDated) {
        return res.json({ error: 'Outdated' });
    }

    const newChecker = res.locals.userRequest;
    let isFull = true;

    // TODO kinda breaks if checkers change their game modes within the week or so, real fix is to change the way QA is saved
    for (const mode of event.modes) {
        const checkers = event.qualityAssuranceCheckers.filter(checker => checker.fullModes.includes(mode)).length;

        if (checkers < 2 && newChecker.isFullBnFor(mode)) {
            isFull = false;
            break;
        }
    }

    if (isFull) {
        return res.json({ error: 'You cannot check filled maps or not related to your game mode' });
    }

    if (event.userId == newChecker.osuId || bubble.userId == newChecker.osuId) {
        return res.json({ error: 'You cannot check your nominations!' });
    }

    const newEvent = await Aiess
        .findByIdAndUpdate(req.params.id, { $push: { qualityAssuranceCheckers: newChecker._id } })
        .populate(defaultPopulate);

    res.json(newEvent);

    Logger.generate(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${newEvent.beatmapsetId}`,
        'qualityAssurance',
        newEvent._id
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
        `Removed ${req.session.username} from QA checker for s/${event.beatmapsetId}`,
        'qualityAssurance',
        event._id
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
