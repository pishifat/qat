const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const util = require('../helpers/util');
const Discussion = require('../models/discussion');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasBasicAccess);

const defaultPopulate = [
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
        },
    },
];

function getBnDefaultPopulate (mongoId) {
    return {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
    };
}

/* GET discussions. */
router.get('/relevantInfo', async (req, res) => {
    let discussions;

    if (res.locals.userRequest.hasFullReadAccess) {
        discussions = await Discussion
            .find({})
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });

    } else {
        discussions = await Discussion
            .find({ isNatOnly: { $ne: true } })
            .populate(getBnDefaultPopulate(req.session.mongoId))
            .sort({ createdAt: -1 });
    }

    res.json({
        discussions,
    });
});

/* POST create a new discussion vote. */
router.post('/submit', middlewares.isNat, async (req, res) => {
    let url = req.body.discussionLink;

    if (url.length == 0) {
        url = undefined;
    }

    if (req.body.discussionLink.length) {
        util.isValidUrlOrThrow(url, 'osu.ppy.sh');
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
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.yellow,
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

    const discussion = await Discussion
        .findById(req.params.id)
        .populate('mediations');

    let mediation = discussion.mediations.find(m => m.mediator == req.session.mongoId);
    let isNewMediation = false;

    if (!mediation) {
        isNewMediation = true;
        mediation = new Mediation();
        mediation.mediator = req.session.mongoId;
    }

    mediation.comment = req.body.comment;
    mediation.vote = req.body.vote;
    await mediation.save();

    if (isNewMediation) {
        discussion.mediations.push(mediation);
        await discussion.save();
    }

    let d = await Discussion
        .findById(req.params.id)
        .populate(
            res.locals.userRequest.isNat ? defaultPopulate : getBnDefaultPopulate(req.session.mongoId)
        );

    res.json(d);

    Logger.generate(
        req.session.mongoId,
        'Submitted vote for a discussion'
    );

    if (isNewMediation && res.locals.userRequest.isNat) {
        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.lightYellow,
                description: `Submitted vote for [discussion on **${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            }],
            d.mode
        );
    }
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', middlewares.isNat, async (req, res) => {
    const d = await Discussion
        .findByIdAndUpdate(req.params.id, { isActive: false })
        .populate(defaultPopulate);

    res.json(d);

    Logger.generate(
        req.session.mongoId,
        'Concluded vote for a discussion'
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkYellow,
            description: `Concluded vote for [discussion on **${d.title}**](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
        }],
        d.mode
    );
});

/* POST update discussion */
router.post('/:id/update', middlewares.isNat, async (req, res) => {
    const title = req.body.title;
    const shortReason= req.body.shortReason;
    console.log(req.body);

    if (!title || !shortReason) {
        return res.json({
            error: 'Missing data',
        });
    }

    const discussion = await Discussion
        .findOne({
            _id: req.params.id,
            creator: req.session.mongoId,
            isActive: true,
        })
        .populate(defaultPopulate)
        .orFail();

    discussion.title = title;
    discussion.shortReason = shortReason;
    await discussion.save();

    res.json(discussion);
    Logger.generate(
        req.session.mongoId,
        `Changed discussion title to "${title}" and proposal to "${shortReason}"`
    );
});

module.exports = router;
