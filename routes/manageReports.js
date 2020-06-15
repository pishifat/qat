const express = require('express');
const Logger = require('../models/log');
const Report = require('../models/report');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

//population
const defaultPopulate = [
    { path: 'culprit', select: 'username osuId group' },
    { path: 'reporter', select: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    const openReports = await Report
        .find({ isActive: true })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({ openReports });
});

/* POST submit or edit eval */
router.post('/submitReportEval/:id', middlewares.isNotSpectator, async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await Report.findByIdAndUpdate(req.params.id, { feedback: req.body.feedback });
    }

    if (req.body.vote) {
        await Report.findByIdAndUpdate(req.params.id, { valid: req.body.vote });
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

    if (req.body.vote) {
        Logger.generate(
            req.session.mongoId,
            `Set validity of report to
            "${req.body.vote == 1 ? 'valid' : req.body.vote == 2 ? 'partially valid' : 'invalid'}"`
        );
    }
});

/* GET search for user */
router.get('/search/:user', async (req, res) => {
    let u;
    const userToSearch = decodeURI(req.params.user);

    if (isNaN(userToSearch)) {
        u = await User.findByUsername(userToSearch);
    } else {
        u = await User.findOne({ osuId: parseInt(userToSearch) });
    }

    if (!u) {
        return res.json({ error: 'Cannot find user!' });
    }

    const closedReports = await Report
        .find({ isActive: false, culprit: u.id })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json(closedReports);
});

/* GET search by number of rounds */
router.get('/searchRecent/:limit', async (req, res) => {
    const limit = parseInt(req.params.limit);

    const closedReports = await Report
        .find({ isActive: false })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

    res.json(closedReports);
});

/* GET search for user */
router.get('/searchById/:id', async (req, res) => {
    const idToSearch = decodeURI(req.params.id);

    const report = await Report
        .findById(idToSearch)
        .populate(defaultPopulate);

    if (!report) {
        return res.json({ error: 'Cannot find report!' });
    }

    res.json(report);
});

module.exports = router;
