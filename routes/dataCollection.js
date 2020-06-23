const express = require('express');
const middlewares = require('../helpers/middlewares');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

/* GET dq/pop listing */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 90);
    let data = await Aiess
        .find({
            $or: [
                { eventType: 'Disqualified' },
                { eventType: 'Popped' },
            ],
            timestamp: { $gte: date },
        })
        .sort({ timestamp: -1 });

    res.json({
        events: data,
    });
});

/* POST edit reason for dq/pop */
router.post('/updateContent/:id', middlewares.isNat, async (req, res) => {
    let a = await Aiess.findByIdAndUpdate(req.params.id, { content: req.body.reason });

    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json(req.body.reason);
        Logger.generate(req.session.mongoId, `Updated DQ reason of s/${a.beatmapsetId} to "${a.content}"`, 'dataCollection', a._id);
    }
});

/* POST edit obviousness */
router.post('/updateObviousness/:id', middlewares.isNat, async (req, res) => {
    let obviousness = parseInt(req.body.obviousness);
    let a = await Aiess.findById(req.params.id).orFail();

    if (obviousness == a.obviousness) {
        obviousness = null;
    }

    a.obviousness = obviousness;
    await a.save();

    res.json(req.body.obviousness);
    Logger.generate(req.session.mongoId, `Updated obviousness of s/${a.beatmapsetId} to "${obviousness}"`, 'dataCollection', a._id);
});

/* POST edit severity */
router.post('/updateSeverity/:id', middlewares.isNat, async (req, res) => {
    let severity = parseInt(req.body.severity);
    let a = await Aiess.findById(req.params.id).orFail();

    if (severity == a.severity) {
        severity = null;
    }

    a.severity = severity;
    await a.save();

    res.json(req.body.severity);
    Logger.generate(req.session.mongoId, `Updated severity of s/${a.beatmapsetId} to "${severity}"`, 'dataCollection', a._id);
});

module.exports = router;
