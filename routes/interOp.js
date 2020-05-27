const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');

const router = express.Router();

router.use((req, res, next) => {
    const secret = req.header('Qat-Signature');

    if (!secret || config.interOpSecret !== secret)
        return res.status(401).send('Invalid signature');

    return next();
});

router.get('/users', async (_, res) => {
    res.json(await User.getAllByMode(true, true, true));
});

router.get('/qualityAssuranceEvents/:id', async (req, res) => {
    const [enterQualified, exitQualified] = await Promise.all([
        Aiess
            .find({ beatmapsetId: req.params.id, eventType: 'Qualified' })
            .populate({ path: 'qualityAssuranceCheckers' })
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                beatmapsetId: req.params.id,
                $or: [{ eventType: 'Disqualified' }, { eventType: 'Ranked' }],
            })
            .sort({ timestamp: -1 }),
    ]);

    res.json({ enterQualified, exitQualified });
});

module.exports = router;
