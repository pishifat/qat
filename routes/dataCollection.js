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
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
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
    res.json(data);
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
router.post('/updateValidity/:id', async (req, res) => {
    let a = await aiessService.update(req.params.id, { valid: req.body.validity });
    if (!a) {
        res.json({ error: 'Something went wrong' });
    } else {
        res.json(a);
        logsService.create(
            req.session.mongoId,
            `Updated validity of s/${a.beatmapsetId} to 
            "${req.body.validity == 1 ? 'valid' : req.body.validity == 2 ? 'partially valid' : 'invalid'}"`
        );
    }
});

module.exports = router;
