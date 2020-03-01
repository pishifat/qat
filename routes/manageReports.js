const express = require('express');
const api = require('../helpers/api');
const logsService = require('../models/log').service;
const reportsService = require('../models/report').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('managereports', {
        title: 'Manage Reports',
        script: '../javascripts/manageReports.js',
        isReports: true,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { populate: 'culprit', display: 'username osuId group' },
    { populate: 'reporter', display: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 90);
    let r = await reportsService.query({ createdAt: { $gte: minDate } }, defaultPopulate, { createdAt: 1 }, true);
    res.json({
        r,
        isLeader: res.locals.userRequest.isLeader,
    });
});

/* POST submit or edit eval */
router.post('/submitReportEval/:id', api.isNotSpectator, async (req, res) => {
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

/* POST change display of report on evals */
router.post('/changeEvalDisplay/:id', api.isNotSpectator, async (req, res) => {
    await reportsService.update(req.params.id, { display: !req.body.display });
    let r = await reportsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(r);

    logsService.create(
        req.session.mongoId,
        `Set report to ${req.body.display ? 'be hidden' : 'display'}  on evaluations`
    );
});

module.exports = router;
