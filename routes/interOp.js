const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const User = require('../models/user');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('Qat-Key');

    if (!secret || config.interOpSecret !== secret)
        return res.status(401).send('Invalid key');

    return next();
});


/* GET users in BN/NAT */
router.get('/users', async (_, res) => {
    res.json(await User.find({ groups: { $in: ['bn', 'nat'] } }));
});

/* GET users in or previously in BN/NAT */
router.get('/users/all', async (_, res) => {
    res.json(
        await User.find({
            $or: [
                { history: { $ne: [], $exists: true } },
            ],
        })
    );
});

/* GET specific user info */
router.get('/users/:osuId', async (req, res) => {
    res.json(await User.findOne({ osuId: req.params.osuId }));
});

/* GET general reason for BN removal */
router.get('/bnRemoval/:osuId', async (req, res) => {
    const user = await User.findOne({ osuId: req.params.osuId });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const latestEvalRound = await BnEvaluation
        .findOne({ user: user._id, consensus: 'fail', active: false })
        .sort({ $natural: -1 });

    if (!latestEvalRound) {
        return res.status(404).send('User has no BN removal logged');
    }

    res.json(latestEvalRound.resignedOnGoodTerms || latestEvalRound.resignedOnStandardTerms ? 'Resigned' : 'Kicked');
});

/* GET events for beatmapsetID */
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
