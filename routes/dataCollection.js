const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Logger = require('../models/log');
const util = require('../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNatOrTrialNat);

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
            timestamp: { $gt: date },
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
                { impactNum: undefined },
                {
                    $or: [
                        { type: 'disqualify' },
                        { type: 'nomination_reset' },
                    ],
                },
            ],
            timestamp: { $gt: date },
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

/* impact webhook */
async function impactWebhook(event, req) {
    const impactString = ['✅ Minor', '⚠️ Notable','❌ Severe'];

    for (const mode of event.modes) {
        const previousEvents = await Aiess
            .find({
                beatmapsetId: event.beatmapsetId,
                timestamp: { $lt: event.timestamp },
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

        const nominators = users.map(u => `[${u.username}](https://osu.ppy.sh/users/${u.osuId})`).join(', ');

        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                description: `Changed **impact level on [nomination reset](https://osu.ppy.sh/beatmapsets/${event.beatmapsetId}/discussion/-/generalAll#/${event.discussionId})** (${nominators})`,
                color: discord.webhookColors.lightPink,
                fields: [
                    {
                        name: 'Impact',
                        value: impactString[event.impactNum],
                    },
                    {
                    name: 'Reason',
                    value: util.shorten(event.content, 1000),
                    }
                ],
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

    if (typeof event.impactNum === 'number') {
        await impactWebhook(event, req);
    }

    Logger.generate(req.session.mongoId, `Updated DQ reason of s/${event.beatmapsetId} to "${event.content}"`, 'dataCollection', event._id);
});

/* POST edit impact */
router.post('/updateImpact/:id', middlewares.isNat, async (req, res) => {
    const impactString = ['Minor', 'Notable','Severe'];

    let event = await Aiess.findByIdAndUpdate(req.params.id, { impactNum: req.body.impactNum }).orFail();

    res.json({
        impactNum: req.body.impactNum,
        success: `Changed impact to: ${impactString[req.body.impactNum]}`,
    });

    await impactWebhook(event, req);

    Logger.generate(req.session.mongoId, `Updated impact of s/${event.beatmapsetId} to "${event.impactNum}"`, 'dataCollection', event._id);
});

module.exports = router;
