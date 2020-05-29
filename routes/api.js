const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');

const router = express.Router();

router.use((req, res, next) => {
    const secret = req.header('Qat-Key');

    if (!secret || config.apiSecret !== secret)
        return res.status(401).send('Invalid API key');

    return next();
});

router.get('/users', async (_, res) => {
    res.json(await User.find({ group: { $in: ['bn', 'nat'] } }));
});

router.get('/users/all', async (_, res) => {
    res.json(
        await User.find({
            $or: [
                { bnDuration: { $ne: [] } },
                { natDuration: { $ne: [] } },
            ]
        })
    );
});

router.get('/users/:osuId', async (req, res) => {
    res.json(await User.findOne({ osuId: req.params.osuId }));
});

router.get('/events/:beatmapsetId', async (req, res) => {
    res.json(
        await Aiess
            .find({ beatmapsetId: req.params.beatmapsetId })
            .populate([
                { path: 'qualityAssuranceCheckers', select: 'osuId username' },
                { path: 'qualityAssuranceComments', populate: { path: 'mediator', select: 'osuId username' } },
            ])
            .sort({ timestamp: 1 })
    );
});

module.exports = router;
