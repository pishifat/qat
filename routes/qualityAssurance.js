const express = require('express');
const api = require('../helpers/api');
const aiessService = require('../models/aiess').service;
const logsService = require('../models/log').service;

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
    { populate: 'qualityAssuranceCheckers', display: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    const [data, dqs] = await Promise.all([
        aiessService.query(
            { 
                eventType: 'Qualified',
                timestamp: { $gte: date } },
            defaultPopulate,
            { timestamp: -1 },
            true
        ),
        aiessService.query(
            { 
                eventType: 'Disqualified',
                timestamp: { $gte: date } },
            defaultPopulate,
            { timestamp: -1 },
            true
        ),
    ]);
    res.json({ 
        maps: data, 
        dqs, 
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
    const [data, dqs] = await Promise.all([
        aiessService.query(
            { 
                eventType: 'Qualified', 
                timestamp: { $lte: date }, 
                hostId: { $exists: true } 
            },
            defaultPopulate,
            { timestamp: -1 },
            true,
            parseInt(req.params.limit),
            parseInt(req.params.skip)
        ),
        aiessService.query(
            { 
                eventType: 'Disqualified', 
                timestamp: { $lte: date }, 
                hostId: { $exists: true } 
            },
            defaultPopulate,
            { timestamp: -1 },
            true,
            parseInt(req.params.limit),
            parseInt(req.params.skip)
        ),
    ]);

    res.json({ 
        maps: data, 
        dqs,
    });
});

/* POST assign user */
router.post('/assignUser/:id', api.isBnOrNat, api.isNotProbation, async (req, res) => {
    let e = await aiessService.update(req.params.id, { $push: { qualityAssuranceCheckers: req.session.mongoId } });
    e = await aiessService.query({ _id: req.params.id }, defaultPopulate);
    res.json(e);

    logsService.create(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${e.beatmapsetId}`
    );

    let qualityAssuranceChecks = await aiessService.query({ qualityAssuranceCheckers: req.session.mongoId }, {}, {}, true);

    const authorUser = {
        name: `${req.session.username} (${qualityAssuranceChecks.length})`,
        icon_url: `https://a.ppy.sh/${req.session.osuId}`,
        url: `https://osu.ppy.sh/users/${req.session.osuId}`,
    };
    const authorBeatmap = {
        name: `${e.metadata} (${e.hostName})`,
        url: `https://osu.ppy.sh/beatmapsets/${e.beatmapsetId}`,
    };
    const thumbnail = {
        url:  `https://b.ppy.sh/thumb/${e.beatmapsetId}.jpg`,
    };
    const colorUser = '11720607';
    const colorBeatmap = '11726590';
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
        if(i + 1 < e.qualityAssuranceCheckers.length){
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
                color: colorUser,
                fields: fieldsUser,
            }], 
            'standardQualityAssurance'
        );
        if (e.qualityAssuranceCheckers.length > e.modes.length * 2 - 1) {
            api.webhookPost(
                [{
                    author: authorBeatmap,
                    thumbnail,
                    color: colorBeatmap,
                    fields: fieldsBeatmap,
                }], 
                'standardQualityAssurance'
            );
        }
    } if (e.modes.includes('taiko') || e.modes.includes('catch') || e.modes.includes('mania')) {
        await api.webhookPost(
            [{
                author: authorUser,
                color: colorUser,
                fields: fieldsUser,
            }], 
            'taikoCatchManiaQualityAssurance'
        );
        if (e.qualityAssuranceCheckers.length > e.modes.length * 2 - 1) {
            api.webhookPost(
                [{
                    author: authorBeatmap,
                    thumbnail,
                    color: colorBeatmap,
                    fields: fieldsBeatmap,
                }], 
                'taikoCatchManiaQualityAssurance'
            );
        }
    }
    
    
});

/* POST unassign user */
router.post('/unassignUser/:id', api.isBnOrNat, api.isNotProbation, async (req, res) => {
    let e = await aiessService.update(req.params.id, { $pull: { qualityAssuranceCheckers: req.session.mongoId } });
    e = await aiessService.query({ _id: req.params.id }, defaultPopulate);
    res.json(e);

    logsService.create(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${e.beatmapsetId}`
    );

    let qualityAssuranceChecks = await aiessService.query({ qualityAssuranceCheckers: req.session.mongoId }, {}, {}, true);

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
    } if (e.modes.includes('taiko') || e.modes.includes('catch') || e.modes.includes('mania')) {
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
