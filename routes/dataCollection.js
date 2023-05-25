const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Logger = require('../models/log');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccessOrTrialNat);

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
router.get('/loadUnsetEvents', middlewares.isNat, async (req, res) => {
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
router.post('/toggleIsReviewed/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let a = await Aiess.findById(req.params.id).orFail();

    a.isReviewed = !a.isReviewed;
    await a.save();

    res.json({
        isReviewed: a.isReviewed,
        success: 'Toggled reviewed status. Refresh to see changes',
    });

    Logger.generate(req.session.mongoId, `Toggled review status of s/${a.beatmapsetId} to ${a.isReviewed}`, 'dataCollection', a._id);
});

/* SEV rating webhook */
async function sevRatingWebhook(event, req) {
    for (const mode of event.modes) {
        const previousEvents = await Aiess
            .find({
                beatmapsetId: event.beatmapsetId,
                timestamp: { $lte: event.timestamp },
                $and: [
                    { type: { $ne: 'rank' } },
                    { type: { $ne: 'disqualify' } },
                    { type: { $ne: 'nomination_reset' } },
                    { type: { $exists: true } },
                ],
                
            })
            .sort({ timestamp: -1 })
            .limit(event.type == 'nomination_reset' ? 1 : 2);

        const users = [];

        for (const previousEvent of previousEvents) {
            const user = await User.findOne({ osuId: previousEvent.userId });
            users.push(user);
        }

        const x = users.map(u => `[${u.username}](https://osu.ppy.sh/users/${u.osuId})`);
        const y = x.join(', ');

        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                description: `Set **notable SEV on [nomination reset](https://osu.ppy.sh/beatmapsets/${event.beatmapsetId}/discussion/-/generalAll#/${event.discussionId})** (${y}): **${event.obviousness}/${event.severity}**`,
                color: discord.webhookColors.lightPink,
                fields: [{
                    name: 'Reason',
                    value: event.content,
                }],
            }],
            mode,
        );
    }
}

/* POST edit reason for dq/pop */
router.post('/updateContent/:id', middlewares.isNat, async (req, res) => {
    let event = await Aiess.findByIdAndUpdate(req.params.id, { content: req.body.reason }).orFail();

    res.json({
        reason: req.body.reason,
        success: 'Updated content',
    });

    if ((event.obviousness || event.obviousness == 0) && (event.severity || event.severity == 0) && (event.obviousness + event.severity >= 2)) {
        await sevRatingWebhook(event, req);
    }

    Logger.generate(req.session.mongoId, `Updated DQ reason of s/${event.beatmapsetId} to "${event.content}"`, 'dataCollection', event._id);
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

    if ((event.obviousness || event.obviousness == 0) && (event.severity || event.severity == 0) && (event.obviousness + event.severity >= 2)) {
        await sevRatingWebhook(event, req);
    }

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

    if ((event.obviousness || event.obviousness == 0) && (event.severity || event.severity == 0) && (event.obviousness + event.severity >= 2)) {
        await sevRatingWebhook(event, req);
    }

    Logger.generate(req.session.mongoId, `Updated severity of s/${event.beatmapsetId} to "${severity}"`, 'dataCollection', event._id);
});

module.exports = router;
