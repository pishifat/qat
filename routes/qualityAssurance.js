const express = require('express');
const api = require('../helpers/api');
const Aiess = require('../models/aiess');
const Logger = require('../models/log');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('qualityassurance', {
        title: 'Quality Assurance',
        script: '../javascripts/qualityAssurance.js',
        isQualityAssurance: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

const defaultPopulate = [
    { path: 'qualityAssuranceCheckers', select: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const [data, overwrite] = await Promise.all([
        Aiess
            .find({
                eventType: 'Qualified',
                timestamp: { $gte: date },
            })
            .populate(defaultPopulate)
            .sort({ timestamp: -1 }),

        Aiess
            .find({
                $or: [
                    { eventType: 'Disqualified' },
                    { eventType: 'Ranked' },
                ],
                timestamp: { $gte: date },
            })
            .populate(defaultPopulate)
            .sort({ timestamp: -1 }),
    ]);
    res.json({
        maps: data,
        overwrite,
        userId: res.locals.userRequest.id,
        userOsuId: res.locals.userRequest.osuId,
        username: res.locals.userRequest.username,
        isNat: res.locals.userRequest.isNat,
        mode: res.locals.userRequest.modes[0] || 'osu',
    });
});

/* GET load more content */
router.get('/loadMore/:limit/:skip', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const data = await Aiess
        .find({
            eventType: 'Qualified',
            timestamp: { $lte: date },
            hostId: { $exists: true },
        })
        .populate(defaultPopulate)
        .sort({ timestamp: -1 })
        .limit(parseInt(req.params.limit))
        .skip(parseInt(req.params.skip));

    res.json({ maps: data });
});

/* POST assign user */
router.post('/assignUser/:id', api.isBnOrNat, async (req, res) => {
    let e = await Aiess.findById(req.params.id).populate(defaultPopulate);

    let validMode;

    for (let i = 0; i < res.locals.userRequest.modes.length; i++) {
        const mode = res.locals.userRequest.modes[i];

        if (e.modes.includes(mode)) {
            validMode = true;
            break;
        }
    }

    if (!validMode) {
        return res.json({ error: 'Not qualified for this mode!' });
    }

    let probation;

    for (let i = 0; i < res.locals.userRequest.probation.length; i++) {
        const mode = res.locals.userRequest.probation[i];

        if (e.modes.includes(mode)) {
            probation = true;
            break;
        }
    }

    if (probation) {
        return res.json({ error: 'Probation cannot do this!' });
    }

    e = await Aiess
        .findByIdAndUpdate(req.params.id, { $push: { qualityAssuranceCheckers: req.session.mongoId } })
        .populate(defaultPopulate);

    res.json(e);

    Logger.generate(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${e.beatmapsetId}`
    );

    let qualityAssuranceChecks = await Aiess.find({ qualityAssuranceCheckers: req.session.mongoId });

    const authorUser = {
        name: `${req.session.username} (${qualityAssuranceChecks.length} time${qualityAssuranceChecks.length > 1 ? 's' : ''})`,
        icon_url: `https://a.ppy.sh/${req.session.osuId}`,
        url: `https://osu.ppy.sh/users/${req.session.osuId}`,
    };
    const footer = {
        text: qualityAssuranceChecks.length == 10 ? 'Thank you for creating a better ranked section! ✨' :
            qualityAssuranceChecks.length == 20 ? `You're making osu! a better place. Thanks again!' 💖` :
                qualityAssuranceChecks.length == 69 ? `_nice_` :
                    qualityAssuranceChecks.length == 100 ? `ever heard of passion? ${req.session.username} has it. you clearly don't so get off your bum and check some maps buddy` : '',
    };
    const authorBeatmap = {
        name: `${e.metadata} (${e.hostName})`,
        url: `https://osu.ppy.sh/beatmapsets/${e.beatmapsetId}`,
    };
    const thumbnail = {
        url: `https://b.ppy.sh/thumb/${e.beatmapsetId}.jpg`,
    };
    const fieldsUser = [
        {
            name: `http://bn.mappersguild.com/qualityassurance`,
            value: `Marked as QA checker for a beatmap`,
        },
    ];
    let userList = '';

    for (let i = 0; i < e.qualityAssuranceCheckers.length; i++) {
        let user = e.qualityAssuranceCheckers[i];
        userList += user.username;

        if (i + 1 < e.qualityAssuranceCheckers.length) {
            userList += ', ';
        }
    }

    const fieldsBeatmap = [
        {
            name: `http://bn.mappersguild.com/qualityassurance`,
            value: `Reached maximum QA checkers`,
        },
        {
            name: `QA checkers`,
            value: userList,
        },
    ];

    if (e.modes.includes('osu')) {
        await api.webhookPost(
            [{
                author: authorUser,
                color: api.webhookColors.lightGreen,
                fields: fieldsUser,
                footer,
            }],
            'standardQualityAssurance'
        );

        if (e.qualityAssuranceCheckers.length > e.modes.length * 2 - 1) {
            api.webhookPost(
                [{
                    author: authorBeatmap,
                    thumbnail,
                    color: api.webhookColors.white,
                    fields: fieldsBeatmap,
                }],
                'standardQualityAssurance'
            );
        }
    }

    if (e.modes.includes('taiko') || e.modes.includes('catch') || e.modes.includes('mania')) {
        await api.webhookPost(
            [{
                author: authorUser,
                color: api.webhookColors.lightGreen,
                fields: fieldsUser,
                footer,
            }],
            'taikoCatchManiaQualityAssurance'
        );

        if (e.qualityAssuranceCheckers.length > e.modes.length * 2 - 1) {
            api.webhookPost(
                [{
                    author: authorBeatmap,
                    thumbnail,
                    color: api.webhookColors.white,
                    fields: fieldsBeatmap,
                }],
                'taikoCatchManiaQualityAssurance'
            );
        }
    }


});

/* POST unassign user */
router.post('/unassignUser/:id', api.isBnOrNat, async (req, res) => {
    let e = await Aiess
        .findByIdAndUpdate(req.params.id, { $pull: { qualityAssuranceCheckers: req.session.mongoId } })
        .populate(defaultPopulate);

    res.json(e);

    Logger.generate(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${e.beatmapsetId}`
    );

    let qualityAssuranceChecks = await Aiess.find({ qualityAssuranceCheckers: req.session.mongoId });

    const author = {
        name: `${req.session.username} (${qualityAssuranceChecks.length})`,
        icon_url: `https://a.ppy.sh/${req.session.osuId}`,
        url: `https://osu.ppy.sh/users/${req.session.osuId}`,
    };
    const color = '12959680';
    const fields = [
        {
            name: `http://bn.mappersguild.com/qualityassurance`,
            value: `Removed as QA checker for a beatmap (why?)`,
        },
    ];

    if (e.modes.includes('osu')) {
        api.webhookPost(
            [{
                author,
                color,
                fields,
            }],
            'standardQualityAssurance'
        );
    }

    if (e.modes.includes('taiko') || e.modes.includes('catch') || e.modes.includes('mania')) {
        api.webhookPost(
            [{
                author,
                color,
                fields,
            }],
            'taikoCatchManiaQualityAssurance'
        );
    }
});

module.exports = router;
