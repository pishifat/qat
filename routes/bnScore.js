const express = require('express');
const api = require('../models/api');
const bnAppsService = require('../models/bnApp').service;
const evalsService = require('../models/evaluation').service;
const reportsService = require('../models/report').service;
const usersService = require('../models/user').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('bnscore', {
        title: 'Beatmap Nominator Score',
        script: '../js/bnScore.js',
        isBnScore: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let r = await reportsService.query({}, defaultPopulate, { createdAt: 1 }, true);
    res.json({ r: r });
});

/* POST submit or edit eval */
router.post('/submitReportEval/:id', async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await reportsService.update(req.params.id, { feedback: req.body.feedback });
    }
    if (req.body.valid) {
        await reportsService.update(req.params.id, { valid: req.body.valid });
    }
    let r = await reportsService.query({ _id: req.params.id }, defaultPopulate);

    res.json(r);
});

module.exports = router;
