const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const osuBot = require('../helpers/osuBot');
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
            select: 'username osuId groups',
        },
    },
    { path: 'creator' },
];

const inactiveBnDefaultPopulate = [
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'groups',
        },
    },
];

function getActiveBnDefaultPopulate (mongoId) {
    return {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId groups',
            match: {
                _id: mongoId,
            },
        },
    };
}

/* GET discussions. */
router.get('/relevantInfo/:limit', async (req, res) => {
    const limit = parseInt(req.params.limit);
    let discussions;

    if (res.locals.userRequest.hasFullReadAccess) {
        discussions = await Discussion
            .find({ isHidden: { $ne: true } })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(limit);

    } else {
        const [activeDiscussions, inactiveDiscussions] = await Promise.all([
            Discussion
                .find({ isNatOnly: { $ne: true }, isActive: true, isHidden: { $ne: true } })
                .populate(getActiveBnDefaultPopulate(req.session.mongoId))
                .sort({ createdAt: -1 }),
            Discussion
                .find({ isNatOnly: { $ne: true }, isActive: false, isHidden: { $ne: true } })
                .populate(inactiveBnDefaultPopulate)
                .sort({ createdAt: -1 })
                .limit(limit),
        ]);

        discussions = activeDiscussions.concat(inactiveDiscussions);
    }

    res.json({
        discussions,
    });
});

/* GET specific discussion */
router.get('/searchDiscussionVote/:id', async (req, res) => {
    let discussion;
    if (res.locals.userRequest.hasFullReadAccess) {
        discussion = await Discussion
            .findOne({ _id: req.params.id, isHidden: { $ne: true }})
            .populate(defaultPopulate);
    } else {
        const tempDiscussion = await Discussion.findById(req.params.id);

        if (tempDiscussion.isActive) {
            discussion = await Discussion
                .findOne({ _id: req.params.id, isNatOnly: { $ne: true }, isActive: true, isHidden: { $ne: true } })
                .populate(getActiveBnDefaultPopulate(req.session.mongoId));
        } else {
            discussion = await Discussion
                .findOne({ isNatOnly: { $ne: true }, isActive: false, isHidden: { $ne: true } })
                .populate(inactiveBnDefaultPopulate);
        }
    }

    res.json(discussion);
});

/* POST create a new discussion vote. */
router.post('/submit', async (req, res) => {
    let url = req.body.discussionLink;

    if (url.length == 0) {
        url = undefined;

        if (req.body.isContentReview) {
            return res.json({
                error: 'No link provided',
            });
        }
    } else if (!req.body.isContentReview) {
        util.isValidUrlOrThrow(url);
    }

    let title = req.body.title;
    let shortReason = req.body.shortReason;

    if (req.body.isContentReview) {
        const contentReviews = await Discussion.find({ isContentReview: true });
        title = `Content review #${contentReviews.length + 251}`;
        shortReason = `Is this content appropriate for a beatmap? ${url}`;

        if (req.body.shortReason.length) {
            shortReason += `\n\n*${req.body.shortReason}*`;
        }
    }

    let discussion = await Discussion.create({
        discussionLink: url,
        title,
        shortReason,
        mode: req.body.mode,
        creator: req.session.mongoId,
        isNatOnly: req.body.isNatOnly,
        neutralAllowed: req.body.neutralAllowed,
        reasonAllowed: req.body.reasonAllowed,
        isContentReview: req.body.isContentReview,
    });

    discussion = await Discussion
        .findById(discussion.id)
        .populate(defaultPopulate);

    res.json({
        discussion,
        success: 'Submitted discussion',
    });
    Logger.generate(
        req.session.mongoId,
        'Submitted a discussion for voting',
        'discussionVote',
        discussion._id
    );

    // webhooks

    // #content-cases
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${title}](http://bn.mappersguild.com/discussionvote?id=${discussion.id})`,
            fields: [
                {
                    name: `Question/Proposal`,
                    value: shortReason,
                },
            ],
        }],
        req.body.isContentReview ? 'contentCase' : discussion.mode
    );

    if (req.body.isContentReview) {
        // #content-cases
        await discord.roleHighlightWebhookPost('contentCase');

        // #gmt
        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.yellow,
                description: `**New discussion up for vote:** [${title}](http://bn.mappersguild.com/discussionvote?id=${discussion.id})`,
                fields: [
                    {
                        name: `Question/Proposal`,
                        value: shortReason,
                    },
                ],
            }],
            'internalContentCase'
        );
    }
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
            res.locals.userRequest.isNat ? defaultPopulate : getActiveBnDefaultPopulate(req.session.mongoId)
        );

    res.json({
        discussion: d,
        success: 'Submitted vote',
    });

    Logger.generate(
        req.session.mongoId,
        'Submitted vote for a discussion',
        'discussionVote',
        d._id
    );
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', middlewares.hasFullReadAccess, async (req, res) => {
    const discussion = await Discussion
        .findByIdAndUpdate(req.params.id, { isActive: false })
        .populate(defaultPopulate);

    res.json({
        discussion,
        success: 'Concluded vote',
    });

    Logger.generate(
        req.session.mongoId,
        'Concluded vote for a discussion',
        'discussionVote',
        discussion._id
    );

    if (discussion.isContentReview) {
        const messages = await discord.contentCaseWebhookPost(discussion);
        await osuBot.sendMessages(discussion.creator.osuId, messages);
    } else {
        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.darkYellow,
                description: `Concluded vote for [discussion on **${discussion.title}**](http://bn.mappersguild.com/discussionvote?id=${discussion.id})`,
            }],
            discussion.mode
        );
    }

});

/* POST update discussion */
router.post('/:id/update', middlewares.hasFullReadAccess, async (req, res) => {
    const title = req.body.title;
    const shortReason = req.body.shortReason;
    const discussionLink = req.body.discussionLink || '';

    if (!title || !shortReason) {
        return res.json({
            error: 'Missing data',
        });
    }

    const discussion = await Discussion
        .findOne({
            _id: req.params.id,
            isActive: true,
        })
        .populate(defaultPopulate)
        .orFail();

    discussion.title = title;
    discussion.shortReason = shortReason;
    discussion.discussionLink = discussionLink;
    await discussion.save();

    res.json({
        discussion,
        success: 'Updated',
    });

    Logger.generate(
        req.session.mongoId,
        `Changed discussion title to "${title}" and proposal to "${shortReason}"`,
        'discussionVote',
        discussion._id
    );
});

module.exports = router;
