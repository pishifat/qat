const express = require('express');
const api = require('../helpers/api');
const Logger = require('../models/log');
const Report = require('../models/report');

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
    { path: 'culprit', select: 'username osuId group' },
    { path: 'reporter', select: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 90);
    let r = await Report
        .find({ createdAt: { $gte: minDate } })
        .populate(defaultPopulate)
        .sort({ createdAt: 1 });

    res.json({
        r,
        isLeader: res.locals.userRequest.isLeader,
    });
});

/* POST submit or edit eval */
router.post('/submitReportEval/:id', api.isNotSpectator, async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await Report.findByIdAndUpdate(req.params.id, { feedback: req.body.feedback });
    }

    if (req.body.valid) {
        await Report.findByIdAndUpdate(req.params.id, { valid: req.body.valid });
    }

    if (req.body.close) {
        await Report.findByIdAndUpdate(req.params.id, { isActive: false });
    }

    let r = await Report
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(r);

    if (req.body.feedback && req.body.feedback.length) {
        Logger.generate(
            req.session.mongoId,
            `Set feedback on report to "${
                req.body.feedback.length > 50 ? req.body.feedback.slice(0, 50) + '...' : req.body.feedback
            }"`
        );
    }

    if (req.body.valid) {
        Logger.generate(
            req.session.mongoId,
            `Set validity of report to
            "${req.body.valid == 1 ? 'valid' : req.body.valid == 2 ? 'partially valid' : 'invalid'}"`
        );
    }
});

/* POST change display of report on evals */
router.post('/changeEvalDisplay/:id', api.isNotSpectator, async (req, res) => {
    const r = await Report
        .findByIdAndUpdate(req.params.id, { display: !req.body.display })
        .populate(defaultPopulate);

    res.json(r);

    Logger.generate(
        req.session.mongoId,
        `Set report to ${req.body.display ? 'be hidden' : 'display'}  on evaluations`
    );
});

module.exports = router;
