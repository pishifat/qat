const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Logger = require('../models/log');
const util = require('../helpers/util');
const osu = require('../helpers/osu');

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

/* SEV rating webhook */
async function sevRatingWebhook(event, req) {
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

/* POST sync beatmapset events */
router.post('/syncBeatmapsetEvents/:beatmapsetId', middlewares.isNat, async (req, res) => {
    let aiessEvents = await Aiess.find({ beatmapsetId: req.params.beatmapsetId }).sort({ timestamp: -1 });

    const initialEventsLength = aiessEvents.length;

    const osuEvents = await osu.getBeatmapsetEvents(req.session.accessToken, req.params.beatmapsetId);

    // filter osu events that aren't recorded in aiess events
    const filteredOsuEvents = osuEvents.filter(osuEvent => {
        return !aiessEvents.some(aiessEvent => {
            return (
                (osuEvent.type === aiessEvent.type || osuEvent.type === 'nominate' && aiessEvent.type === 'qualify') &&
                new Date(osuEvent.created_at).getTime() === new Date(aiessEvent.timestamp).getTime() &&
                osuEvent.user_id === aiessEvent.userId
            );
        });
    });

    // get beatmapset info for modes, genre, language
    const osuBeatmapset = await osu.getBeatmapsetInfo(req.session.accessToken, req.params.beatmapsetId);

    // Convert the modes to something that can be saved in the database
    let convertedModes = osuBeatmapset.beatmaps.map(beatmap => {
        return util.formatModeForDatabase(beatmap.mode);
    });
    const osuModes = Array.from(new Set(convertedModes));

    // create new aiess events
    for (const osuEvent of filteredOsuEvents) {
        // skip banchobot events
        if (osuEvent.user_id === 3) continue;

        const newEvent = new Aiess({
            type: osuEvent.type,
            timestamp: osuEvent.created_at,
            beatmapsetId: req.params.beatmapsetId,
            creatorId: osuEvent.beatmapset.user_id,
            creatorName: osuEvent.beatmapset.creator,
            modes: osuModes,
            discussionId: osuEvent.discussion?.id ?? null,
            userId: osuEvent.user_id,
            artistTitle: osuEvent.beatmapset.artist + ' - ' + osuEvent.beatmapset.title,
            genre: osuBeatmapset.genre.name,
            language: osuBeatmapset.language.name,
            content: osuEvent.discussion?.starting_post?.message ?? '',
        });

        await newEvent.save();
    }

    // re-fetch to get updated data 
    aiessEvents = await Aiess.find({ beatmapsetId: req.params.beatmapsetId }).sort({ timestamp: -1 });

    // deduplicate events, specifically merging qualify and its relevant nominate
    for (const aiessEvent of aiessEvents) {
        if (aiessEvent.type === "qualify") {
            // check for relevant nominate that has an equal timestamp
            const relevantNominate = aiessEvents.find(
                (e) =>
                    e.type === "nominate" &&
                    new Date(e.timestamp).getTime() === new Date(aiessEvent.timestamp).getTime()
            );
            if (relevantNominate) {
                aiessEvent.userId = relevantNominate.userId;
                aiessEvent.content = relevantNominate.content;
                aiessEvent.discussionId = relevantNominate.discussionId;
                aiessEvent.isReviewed = relevantNominate.isReviewed;
                aiessEvent.obviousness = relevantNominate.obviousness;
                aiessEvent.severity = relevantNominate.severity;
                await aiessEvent.save();
                await relevantNominate.remove();
            }

            // remove qualify events with no user id for safety
            if (!aiessEvent.userId) {
                await aiessEvent.remove();
            }
        }
    }

    const finalEventsLength = aiessEvents.length;

    res.json({
        success: `Synced ${finalEventsLength - initialEventsLength} new events`,
    });

    Logger.generate(req.session.mongoId, `Synced ${finalEventsLength - initialEventsLength} new events for s/${req.params.beatmapsetId}`, 'dataCollection');
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
