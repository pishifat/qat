const express = require('express');
const api = require('../helpers/api');
const Aiess = require('../models/aiess');
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET eval archive page */
router.get('/', (req, res) => {
    res.render('evaluations/datacollection', {
        title: 'Data Collection',
        script: '../javascripts/dataCollection.js',
        isEval: true,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

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
        mode: res.locals.userRequest.modes[0],
    });
});

/* POST edit reason for dq/pop */
router.post('/updateContent/:id', api.isNotSpectator, async (req, res) => {
    let a = await Aiess.findByIdAndUpdate(req.params.id, { content: req.body.reason });

    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json(req.body.reason);
        logsService.create(req.session.mongoId, `Updated DQ reason of s/${a.beatmapsetId} to "${a.content}"`);
        /*await api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '3103310',
                fields:[
                    {
                        name: `https://osu.ppy.sh/beatmapsets/${a.beatmapsetId}/discussion/-/generalAll#/${a.postId}`,
                        value: `Shortened **DQ/reset reason** of "${a.metadata}": ${req.body.reason}`,
                    },
                ],
            }],
            a.modes[0]
        );*/
    }
});

/* POST edit obviousness */
router.post('/updateObviousness/:id', api.isNotSpectator, async (req, res) => {
    let obviousness = parseInt(req.body.obviousness);
    let a = await Aiess.findById(req.params.id).orFail();

    if (obviousness == a.obviousness) {
        obviousness = null;
    }

    a.obviousness = obviousness;
    await a.save();

    res.json(obviousness);
    logsService.create(req.session.mongoId, `Updated obviousness of s/${a.beatmapsetId} to "${obviousness}"`);
    /*await api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '6893914',
            fields:[
                {
                    name: `https://osu.ppy.sh/beatmapsets/${a.beatmapsetId}/discussion/-/generalAll#/${a.postId}`,
                    value: `Set **obviousness** of "${a.metadata}": **${obviousness}**`,
                },
            ],
        }],
        a.modes[0]
    );*/
});

/* POST edit severity */
router.post('/updateSeverity/:id', api.isNotSpectator, async (req, res) => {
    let severity = parseInt(req.body.severity);
    let a = await Aiess.findById(req.params.id).orFail();

    if (severity == a.severity) {
        severity = null;
    }

    a.severity = severity;
    await a.save();

    res.json(severity);
    logsService.create(req.session.mongoId, `Updated severity of s/${a.beatmapsetId} to "${severity}"`);
    /*await api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '4206938',
            fields:[
                {
                    name: `https://osu.ppy.sh/beatmapsets/${a.beatmapsetId}/discussion/-/generalAll#/${a.postId}`,
                    value: `Set **obviousness** of "${a.metadata}": **${severity}**`,
                },
            ],
        }],
        a.modes[0]
    );*/
});

module.exports = router;
