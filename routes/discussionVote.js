const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const osuBot = require('../helpers/osuBot');
const util = require('../helpers/util');
const { websocketManager } = require('../helpers/websocket');
const Discussion = require('../models/discussion');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const User = require('../models/user');

const router = express.Router();

router.use(middlewares.isLoggedIn);

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
router.post('/submit', middlewares.hasBasicAccess, async (req, res) => {
    const { discussionLink, title, shortReason, timestamps, mode, isNatOnly, neutralAllowed, reasonAllowed, isContentReview, customText, agreeOverwriteText, neutralOverwriteText, disagreeOverwriteText } = req.body;

    if (discussionLink.length == 0 && isContentReview) {
        return res.json({
            error: 'No link provided',
        });
    }

    const blockedUrls = [
        'ppy.sh',
        'puu.sh',
        'cdn.discordapp.com'
    ];
    
    if (isContentReview && discussionLink.length > 0 && blockedUrls.some(u => discussionLink.includes(u))) {
        return res.json({
            error: 'images hosted on this website are not allowed, as they can change/get deleted quickly. please use a different image hosting service instead.',
        });
    }
    
    if (discussionLink.length > 0 && !isContentReview) {
        util.isValidUrlOrThrow(discussionLink);
    }

    let overwriteTitle = title;
    let overwriteShortReason = shortReason;

    if (req.body.isContentReview) {
        const contentReviews = await Discussion.find({ isContentReview: true });
        overwriteTitle = `Content review #${contentReviews.length + 251}`;
        overwriteShortReason = `Is this content appropriate for a beatmap? ${discussionLink}`;

        if (req.body.shortReason.length) {
            overwriteShortReason += `\n\n*${req.body.shortReason}*`;
        }

        if (timestamps.length) {
            overwriteShortReason += `\n\n**Timestamps:**\n${timestamps}`;
        }
    }

    let finalAgreeText;
    let finalNeutralText;
    let finalDisagreeText;

    if (customText) {
        if (agreeOverwriteText.length) finalAgreeText = agreeOverwriteText;
        if (neutralAllowed && neutralOverwriteText.length) finalNeutralText = neutralOverwriteText;
        if (disagreeOverwriteText.length) finalDisagreeText = disagreeOverwriteText;
    }

    let discussion = await Discussion.create({
        discussionLink: discussionLink.length > 0 ? discussionLink : null,
        title: overwriteTitle,
        shortReason: overwriteShortReason,
        mode,
        creator: req.session.mongoId,
        isNatOnly,
        neutralAllowed,
        reasonAllowed,
        isContentReview,
        agreeOverwriteText: finalAgreeText,
        neutralOverwriteText: finalNeutralText,
        disagreeOverwriteText: finalDisagreeText,
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

    // websocket for CRs
    if (isContentReview) {
        websocketManager.sendNotification('data:content_review', {
            title: discussion.title,
            shortReason: discussion.shortReason,
            discussionLink: discussion.discussionLink,
            timestamp: new Date(),
        });
    }

    // webhooks

    // #content-cases or #evaluations (BN server)
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${overwriteTitle}](http://bn.mappersguild.com/discussionvote?id=${discussion.id})`,
            fields: [
                {
                    name: `Question/Proposal`,
                    value: overwriteShortReason.length > 900 ? overwriteShortReason.slice(0, 900) + '... *(truncated)*' : overwriteShortReason,
                },
            ],
        }],
        req.body.isContentReview ? 'contentCase' : 'all'
    );

    if (req.body.isContentReview) {
        // #content-review (internal)
        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.yellow,
                description: `**New discussion up for vote:** [${overwriteTitle}](http://bn.mappersguild.com/discussionvote?id=${discussion.id})`,
                fields: [
                    {
                        name: `Question/Proposal`,
                        value: overwriteShortReason.length > 900 ? overwriteShortReason.slice(0, 900) + '... *(truncated)*' : overwriteShortReason,
                    },
                ],
            }],
            'internalContentCase'
        );

        // #content-review (internal)

        const users = await User.find({ isActiveContentReviewer: true });
        const discordIds = users.map(u => u.discordId).filter(d => d);

        // ping in groups of 20 to not hit character limit
        for (let i = 0; i < discordIds.length; i += 20) {
            await util.sleep(1000);
            await discord.userHighlightWebhookPost('internalContentCase', discordIds.slice(i, i + 20));
        }
    }
});

/* POST submit mediation */
router.post('/submitMediation/:id', middlewares.hasBasicAccess, async (req, res) => {
    if (!req.body.vote) {
        return res.json({
            error: 'Select your vote!',
        });
    }

    const discussion = await Discussion
        .findById(req.params.id)
        .populate('mediations');

    if (discussion.isNatOnly && !res.locals.userRequest.isNatOrTrialNat) {
        return res.json({ error: 'Only NAT members can vote on this' });
    }

    let mediation = discussion.mediations.find(m => m.mediator == req.session.mongoId);
    let isNewMediation = false;

    if (!mediation) {
        isNewMediation = true;
        mediation = new Mediation();
        mediation.mediator = req.session.mongoId;
    }

    mediation.comment = req.body.comment;
    mediation.vote = req.body.vote;
    mediation.vccChecked = req.body.vccChecked;
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

    if (!discussion.isContentReview) {
        discord.discussionWebhookPost(discussion, req.session);
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

/* POST set isAcceptable for content review */
router.post('/:id/setIsAcceptable', middlewares.hasFullReadAccess, async (req, res) => {
    const isAcceptable = req.body.isAcceptable;

    const discussion = await Discussion
        .findOne({
            _id: req.params.id,
            isActive: false,
        })
        .populate(defaultPopulate)
        .orFail();

    discussion.isAcceptable = isAcceptable;
    await discussion.save();

    res.json({
        discussion,
        success: 'Updated',
    });

    Logger.generate(
        req.session.mongoId,
        `Changed consensus to ${isAcceptable ? 'pass' : 'fail'}`,
        'discussionVote',
        discussion._id
    );
});

module.exports = router;
