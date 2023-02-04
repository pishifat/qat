const express = require('express');
const Logger = require('../models/log');
const Report = require('../models/report');
const Discussion = require('../models/discussion');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const discord = require('../helpers/discord');
const osuBot = require('../helpers/osuBot');

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
router.post('/submitReportEval/:id', async (req, res) => {
    if (req.body.feedback && req.body.feedback.length) {
        await Report.findByIdAndUpdate(req.params.id, { feedback: req.body.feedback });
    }

    if (req.body.vote) {
        await Report.findByIdAndUpdate(req.params.id, { valid: req.body.vote });
    }

    if (req.body.close) {
        await Report.findByIdAndUpdate(req.params.id, { isActive: false });
    }

    const report = await Report
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json({
        report,
        success: 'Saved evaluation',
    });

    let fields = [];
    let color = discord.webhookColors.pink;
    let thumbnail = {
        url: `https://bn.mappersguild.com/images/qatlogo.png`,
    };

    if (report.culprit && report.culprit.osuId) {
        thumbnail = {
            url: `https://a.ppy.sh/${report.culprit.osuId}`,
        };
    }

    if (req.body.feedback && req.body.feedback.length) {
        Logger.generate(
            req.session.mongoId,
            `Set feedback on report to "${util.shorten(req.body.feedback)}"`,
            'report',
            report._id
        );

        fields.push({
            name: 'Report feedback',
            value: req.body.feedback.length > 900 ? req.body.feedback.slice(0,900) + '... *(truncated)*' : req.body.feedback,
        });
    }

    if (req.body.vote) {
        const validity = req.body.vote == 1 ? 'valid' : req.body.vote == 2 ? 'partially valid' : 'invalid';

        Logger.generate(
            req.session.mongoId,
            `Set validity of report to "${validity}"`,
            'report',
            report._id
        );

        fields.push({
            name: 'Report vote',
            value: validity,
        });
    }

    if (req.body.close) {
        fields = [{
            name: 'Report status',
            value: 'CLOSED',
        }];

        color = discord.webhookColors.red;
    }

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            thumbnail,
            color,
            description: `Adjusted ${req.body.close ? 'status' : 'feedback'} on [report for **${report.culprit ? report.culprit.username : report.link}**](http://bn.mappersguild.com/managereports?id=${report.id})`,
            fields,
        }],
        'natUserReport'
    );
});

/* POST send report to content review */
router.post('/sendToContentReview/:id', async (req, res) => {
    let report = await Report
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const url = report.link;

    if (!url || url.length == 0) {
        return res.json({
            error: 'No link provided',
        });
    }

    const contentReviews = await Discussion.find({ isContentReview: true });
    const title = `Content review #${contentReviews.length + 251}`;
    let shortReason = `Is this content appropriate for a beatmap? ${url}`;
    shortReason += `\n\n*${report.reason}*`;

    let d = await Discussion.create({
        discussionLink: url,
        title,
        shortReason,
        mode: 'all',
        creator: report.reporter._id,
        isNatOnly: false,
        neutralAllowed: false,
        reasonAllowed: true,
        isContentReview: true,
    });

    await Report.findByIdAndUpdate(req.params.id, { isActive: false, feedback: `Report closed and replaced by discussion vote (${d.id})` });
    report = await Report
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json({
        report,
        success: 'Created discussion vote and deleted report',
    });

    Logger.generate(
        req.session.mongoId,
        'Moved a report to content review',
        'discussionVote',
        d._id
    );

    // webhooks

    // #content-cases (BN server)
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(report.reporter),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${title}](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            fields: [
                {
                    name: `Question/Proposal`,
                    value: shortReason.length > 900 ? shortReason.slice(0, 900) + '... *(truncated)*' : shortReason,
                },
            ],
        }],
        'contentCase'
    );

    // #content-cases (BN server)
    await discord.roleHighlightWebhookPost('contentCase', ['gmt']);

    // #content-review (internal)
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(report.reporter),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${title}](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            fields: [
                {
                    name: `Question/Proposal`,
                    value: shortReason.length > 900 ? shortReason.slice(0, 900) + '... *(truncated)*' : shortReason,
                },
            ],
        }],
        'internalContentCase'
    );

    // #content-review (internal)
    await discord.roleHighlightWebhookPost('internalContentCase', ['contentReview']);
});

/* POST send messages */
router.post('/sendMessages/:id', async (req, res) => {
    const report = await Report
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    let messages;

    req.body.users.push({ osuId: req.session.osuId });

    for (const user of req.body.users) {
        messages = await osuBot.sendMessages(user.osuId, req.body.messages);
    }

    if (messages !== true) {
        return res.json({ error: `Messages were not sent. Please let pishifat know!` });
    }

    res.json({ success: 'Messages sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Sent chat messages about a closed report`,
        'report',
        report._id
    );

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.white,
            description: `Sent chat messages for [report for **${report.culprit ? report.culprit.username : report.link}**](http://bn.mappersguild.com/managereports?id=${report.id})`,
        }],
        'natUserReport'
    );
});

module.exports = router;
