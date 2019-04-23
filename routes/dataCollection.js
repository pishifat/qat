const express = require('express');
const api = require('../models/api');
const aiessService = require('../models/aiess').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET eval archive page */
router.get('/', async (req, res, next) => {
    res.render('evaluations/datacollection', {
        title: 'Data Collection',
        script: '../javascripts/dataCollection.js',
        isDataCollection: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* GET dq/pop listing */
router.get('/relevantInfo', async (req, res, next) => {
    let date = new Date();
    date.setDate(date.getDate() - 90);
    let data = await aiessService.query(
        { $or: [{eventType: 'Disqualified'}, {eventType: 'Popped'}], timestamp: { $gte: date } },
        {},
        { timestamp: -1 },
        true
    );
    res.json({
        events: data, 
        mode: res.locals.userRequest.modes[0],
        isSpectator: res.locals.userRequest.isSpectator});
});

/* POST edit reason for dq/pop */
router.post('/updateReason/:id', async (req, res) => {
    let a = await aiessService.update(req.params.id, { content: req.body.reason });
    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json(a);
        logsService.create(req.session.mongoId, `Updated DQ reason of s/${a.beatmapsetId} to "${a.content}"`);
    }
});

/* POST edit validity */
router.post('/updateNotability/:id', async (req, res) => {
    let a = await aiessService.update(req.params.id, { valid: req.body.notability });
    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json(a);
        logsService.create(
            req.session.mongoId,
            `Updated notability of s/${a.beatmapsetId} to 
            "${req.body.notability == 1 ? 'notable' : req.body.notability == 2 ? 'semi-notable' : req.body.notability == 3 ? 'not notable' : 'unmarked'}"`
        );
    }
});

module.exports = router;
