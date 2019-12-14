const config = require('../config.json');
const crypto = require('crypto');
const router = require('express').Router();
const Aiess = require('../models/aiess');
const User = require('../models/user');

router.use((req, res, next) => {
    const expected = crypto.createHmac('sha1', config.interOpSecret)
        .update(req.originalUrl)
        .digest('base64');
    const actual = req.header('Qat-Signature');

    if (!actual || !crypto.timingSafeEqual(expected, actual))
        return res.status(401).send('Invalid signature');

    return next();
});

router.get('/users', async (_, res) => {
    res.json(await User.getAllByMode(true, true, true));
});

router.get('/qa/:id', async (req, res) => {
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

    res.json({enterQualified, exitQualified});
});

module.exports = router;
