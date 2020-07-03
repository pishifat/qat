const express = require('express');
const Logger = require('../models/log');
const Report = require('../models/report');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

//population
const defaultPopulate = [
    { path: 'culprit', select: 'username osuId groups' },
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

/* GET search for user */
router.get('/search/:user', async (req, res) => {
    const userToSearch = decodeURI(req.params.user);
    const user = await User
        .findByUsernameOrOsuId(userToSearch)
        .orFail();

    const closedReports = await Report
        .find({ isActive: false, culprit: user.id })
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

/* POST submit or edit eval */
router.post('/submitReportEval/:id', middlewares.isNat, async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await Report.findByIdAndUpdate(req.params.id, { feedback: req.body.feedback });
    }

    if (req.body.vote) {
        await Report.findByIdAndUpdate(req.params.id, { valid: req.body.vote });
    }

    if (req.body.close) {
        await Report.findByIdAndUpdate(req.params.id, { isActive: false });
    }

    const r = await Report
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(r);

    if (req.body.feedback && req.body.feedback.length) {
        Logger.generate(
            req.session.mongoId,
            `Set feedback on report to "${util.shorten(req.body.feedback)}"`,
            'report',
            r._id
        );
    }

    if (req.body.vote) {
        const validity = req.body.vote == 1 ? 'valid' : req.body.vote == 2 ? 'partially valid' : 'invalid';

        Logger.generate(
            req.session.mongoId,
            `Set validity of report to "${validity}"`,
            'report',
            r._id
        );
    }
});

module.exports = router;
