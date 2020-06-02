const express = require('express');
const api = require('../helpers/api');
const helpers = require('../helpers/helpers');
const Discussion = require('../models/discussion');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

const defaultPopulate = [
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
        },
    },
];

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('discussionvote', {
        title: 'Discussion Vote',
        script: '../javascripts/discussionVote.js',
        loggedInAs: req.session.mongoId,
        isDiscussionVote: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let discussions;

    if (res.locals.userRequest.isNat || res.locals.userRequest.isSpectator) {
        discussions = await Discussion
            .find({})
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });

    } else {
        discussions = await Discussion
            .find({ isNatOnly: { $ne: true } })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });
    }

    res.json({
        discussions,
        userId: req.session.mongoId,
        userModes: res.locals.userRequest.modes,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* POST create a new discussion vote. */
router.post('/submit', api.isNat, async (req, res) => {
    let url = req.body.discussionLink;

    if (url.length == 0) {
        url = undefined;
    }

    if (req.body.discussionLink.length) {
        const validUrl = helpers.isValidUrl(url, 'osu.ppy.sh');
        if (validUrl.error) return res.json({ error: validUrl.error });
    }

    let d = await Discussion.create({
        discussionLink: req.body.discussionLink,
        title: req.body.title,
        shortReason: req.body.shortReason,
        mode: req.body.mode,
        creator: req.session.mongoId,
        isNatOnly: req.body.isNatOnly,
        neutralAllowed: req.body.neutralAllowed,
    });

    res.json(d);
    Logger.generate(req.session.mongoId, 'Submitted a discussion for voting');
    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.yellow,
            description: `**New discussion up for vote:** [${req.body.title}](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            fields: [
                {
                    name: `Proposal`,
                    value: req.body.shortReason,
                },
            ],
        }],
        d.mode
    );
});

/* POST submit mediation */
router.post('/submitMediation/:id', async (req, res) => {
    if (!req.body.vote) {
        return res.json({
            error: 'Select your vote!',
        });
    }

    let m;

    if (req.body.mediationId) {
        m = await Mediation.findById(req.body.mediationId);
    } else {
        m = await Mediation.create({ mediator: req.session.mongoId });
        await Discussion.findByIdAndUpdate(req.params.id, { $push: { mediations: m } });
    }

    await Mediation.findByIdAndUpdate(m._id, { comment: req.body.comment, vote: req.body.vote });

    let d = await Discussion
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(d);

    Logger.generate(
        req.session.mongoId,
        'Submitted vote for a discussion'
    );

    if (!req.body.mediationId && req.session.group == 'nat') {
        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.lightYellow,
                description: `Submitted vote for [discussion on **${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            }],
            d.mode
        );
    }
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', api.isNat, async (req, res) => {
    const d = await Discussion
        .findByIdAndUpdate(req.params.id, { isActive: false })
        .populate(defaultPopulate);

    res.json(d);

    Logger.generate(
        req.session.mongoId,
        'Concluded vote for a discussion'
    );

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.darkYellow,
            description: `Concluded vote for [discussion on **${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
        }],
        d.mode
    );
});

/* POST save title */
router.post('/saveTitle/:id', api.isNat, async (req, res) => {
    const d = await Discussion
        .findByIdAndUpdate(req.params.id, { title: req.body.title })
        .populate(defaultPopulate);

    res.json(d);
    Logger.generate(
        req.session.mongoId,
        `Changed discussion title to "${req.body.title}"`
    );
});

/* POST save shortReason */
router.post('/saveProposal/:id', api.isNat, async (req, res) => {
    const d = await Discussion
        .findByIdAndUpdate(req.params.id, { shortReason: req.body.shortReason })
        .populate(defaultPopulate);

    res.json(d);
    Logger.generate(
        req.session.mongoId,
        `Changed discussion proposal to "${req.body.shortReason}"`
    );
});

module.exports = router;
