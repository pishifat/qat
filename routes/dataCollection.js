const express = require('express');
const middlewares = require('../helpers/middlewares');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

/* GET dq/pop listing */
router.get('/loadRecentEvents', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 90);
    let data = await Aiess
        .find({
            $or: [
                { type: 'disqualify' },
                { type: 'nomination_reset' },
            ],
            timestamp: { $gte: date },
        })
        .sort({ timestamp: -1 });

    res.json({
        events: data,
    });
});

/* GET unset dq/pop listing */
router.get('/loadUnsetEvents', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 365);
    let data = await Aiess
        .find({
            $and: [
                {
                    $or: [
                        { obviousness: null },
                        { severity: null },
                    ],
                },
                {
                    $or: [
                        { type: 'disqualify' },
                        { type: 'nomination_reset' },
                    ],
                },
            ],
            timestamp: { $gte: date },
        })
        .sort({ timestamp: -1 });

    res.json({
        events: data,
    });
});

/* POST toggle isReviewed */
router.post('/toggleIsReviewed/:id', middlewares.isNat, async (req, res) => {
    let a = await Aiess.findById(req.params.id).orFail();

    a.isReviewed = !a.isReviewed;
    await a.save();

    res.json({
        isReviewed: a.isReviewed,
        success: 'Toggled reviewed status. Refresh to see changes',
    });

    Logger.generate(req.session.mongoId, `Toggled review status of s/${a.beatmapsetId} to ${a.isReviewed}`, 'dataCollection', a._id);
});

/* POST edit reason for dq/pop */
router.post('/updateContent/:id', middlewares.isNat, async (req, res) => {
    let a = await Aiess.findByIdAndUpdate(req.params.id, { content: req.body.reason });

    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json({
            reason: req.body.reason,
            success: 'Updated content',
        });
        Logger.generate(req.session.mongoId, `Updated DQ reason of s/${a.beatmapsetId} to "${a.content}"`, 'dataCollection', a._id);
    }
});

/* POST edit obviousness */
router.post('/updateObviousness/:id', middlewares.isNat, async (req, res) => {
    let obviousness = parseInt(req.body.obviousness);
    let event = await Aiess.findById(req.params.id).orFail();

    if (obviousness == event.obviousness) {
        obviousness = null;
    }

    event.obviousness = obviousness;
    await event.save();

    res.json({
        obviousness: event.obviousness,
        success: 'Updated obviousness',
    });

    Logger.generate(req.session.mongoId, `Updated obviousness of s/${event.beatmapsetId} to "${obviousness}"`, 'dataCollection', event._id);
});

/* POST edit severity */
router.post('/updateSeverity/:id', middlewares.isNat, async (req, res) => {
    let severity = parseInt(req.body.severity);
    let event = await Aiess.findById(req.params.id).orFail();

    if (severity == event.severity) {
        severity = null;
    }

    event.severity = severity;
    await event.save();

    res.json({
        severity: event.severity,
        success: 'Updated severity',
    });

    Logger.generate(req.session.mongoId, `Updated severity of s/${event.beatmapsetId} to "${severity}"`, 'dataCollection', event._id);
});

module.exports = router;
