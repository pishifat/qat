const express = require('express');
const api = require('../models/api');
const logsService = require('../models/log').service;
const reportsService = require('../models/report').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('managereports', {
        title: 'Manage Reports',
        script: '../javascripts/manageReports.js',
        isManageReports: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { populate: 'culprit', display: 'username osuId group' },
    { populate: 'reporter', display: 'username osuId' }
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let r = await reportsService.query({}, defaultPopulate, { createdAt: 1 }, true);
    res.json({ 
        r: r, 
        isLeader: res.locals.userRequest.isLeader,
        isSpectator: res.locals.userRequest.isSpectator
    });
});

/* POST submit or edit eval */
router.post('/submitReportEval/:id', async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await reportsService.update(req.params.id, { feedback: req.body.feedback });
    }
    if (req.body.valid) {
        await reportsService.update(req.params.id, { valid: req.body.valid });
    }
    if (req.body.close) {
        await reportsService.update(req.params.id, { isActive: false });
    }
    let r = await reportsService.query({ _id: req.params.id }, defaultPopulate);

    res.json(r);
    if (req.body.feedback && req.body.feedback.length) {
        logsService.create(
            req.session.mongoId,
            `Set feedback on report to "${
                req.body.feedback.length > 50 ? req.body.feedback.slice(0, 50) + '...' : req.body.feedback
            }"`
        );
    }
    if (req.body.valid) {
        logsService.create(
            req.session.mongoId,
            `Set validity of report to
            "${req.body.valid == 1 ? 'valid' : req.body.valid == 2 ? 'partially valid' : 'invalid'}"`
        );
    }
});

module.exports = router;
