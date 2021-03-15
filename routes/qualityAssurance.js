const express = require('express');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const QualityAssuranceCheck = require('../models/qualityAssuranceCheck');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const defaultPopulate = [
    {
        path: 'qualityAssuranceChecks',
        populate: {
            path: 'user',
            select: 'username osuId',
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
router.post('/assignUser/:id/:mode', middlewares.isBnOrNat, async (req, res) => {
    const event = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const newChecker = res.locals.userRequest;

    const [outDated, bubble, qaChecks] = await Promise.all([
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
        QualityAssuranceCheck
            .find({
                event: event._id,
                mode: req.params.mode,
            }),

    ]);

    if (outDated) {
        return res.json({ error: 'Outdated' });
    }

    if (event.userId == newChecker.osuId || bubble.userId == newChecker.osuId) {
        return res.json({ error: 'You cannot check your nominations!' });
    }

    if (event.creatorId == newChecker.osuId) {
        return res.json({ error: 'You cannot check your maps!' });
    }

    if (!newChecker.fullModes.includes(req.params.mode)) {
        return res.json({ error: 'You are not qualified for this game mode!' });
    }

    if (qaChecks.length >= 2) {
        return res.json({ error: 'Map has too many checks for this mode!' });
    }

    let newCheck = new QualityAssuranceCheck();
    newCheck.user = newChecker._id;
    newCheck.event = event._id;
    newCheck.timestamp = new Date();
    newCheck.mode = req.params.mode;

    await newCheck.save();

    const newEvent = await Aiess
        .findById(req.params.id)
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
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const qaCheck = event.qualityAssuranceChecks.find(q => q.user.id == req.session.mongoId);

    if (!qaCheck) {
        return res.json({ error: 'Not assigned' });
    }

    await QualityAssuranceCheck.deleteOne({ _id: qaCheck._id });

    const newEvent = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(newEvent);

    Logger.generate(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${event.beatmapsetId}`,
        'qualityAssurance',
        event._id
    );
});

/* POST unassign user */
router.post('/editComment/:id', middlewares.isBnOrNat, async (req, res) => {
    const qaCheck = await QualityAssuranceCheck
        .findById(req.body.qaCheckId)
        .populate(defaultPopulate)
        .orFail();

    qaCheck.comment = req.body.comment.trim();

    await qaCheck.save();

    const newEvent = await Aiess
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(newEvent);
});

/* GET load more content */
router.get('/loadLeaderboard', async (req, res) => {
    let sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [users, recentQaChecks, allQaChecks] = await Promise.all([
        User
            .find({
                $or: [
                    { groups: 'nat' },
                    { groups: 'bn' },
                ],
            })
            .sort({ username: 1 }),
        QualityAssuranceCheck.find({ timestamp: { $gte: sevenDaysAgo } }),
        QualityAssuranceCheck.find({}),
    ]);

    const modes = ['osu', 'taiko', 'catch', 'mania'];
    const data = [];

    for (const mode of modes) {
        const modeUsers = [];

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            const recent = recentQaChecks.filter(q => q.user.toString() == user.id && q.mode == mode);
            const all = allQaChecks.filter(q => q.user.toString() == user.id && q.mode == mode);

            if (user.isBnFor(mode)) {
                modeUsers.push({
                    id: user.id,
                    username: user.username,
                    osuId: user.osuId,
                    recentQaChecks: recent.length,
                    allQaChecks: all.length,
                });
            }

        }

        const overallUsers = [...modeUsers];
        const recentUsers = [...modeUsers];

        overallUsers.sort((a, b) => {
            if (a.allQaChecks > b.allQaChecks) return -1;
            if (a.allQaChecks < b.allQaChecks) return 1;

            return 0;
        });

        recentUsers.sort((a, b) => {
            if (a.recentQaChecks > b.recentQaChecks) return -1;
            if (a.recentQaChecks < b.recentQaChecks) return 1;

            return 0;
        });

        const overallDisplayUsers = overallUsers.filter(u => u.allQaChecks > 0);
        const recentDisplayUsers = recentUsers.filter(u => u.recentQaChecks > 0);

        data.push({
            mode,
            overallDisplayUsers,
            recentDisplayUsers,
        });
    }

    res.json(data);
});

module.exports = router;
