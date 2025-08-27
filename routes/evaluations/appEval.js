const express = require('express');
const moment = require('moment');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const User = require('../../models/user');
const Logger = require('../../models/log');
const { submitEval, submitMockEval, selectMockEvaluators, setGroupEval, setFeedback, replaceUser } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const util = require('../../helpers/util');
const discord = require('../../helpers/discord');
const osu = require('../../helpers/osu');
const { AppEvaluationConsensus } = require('../../shared/enums');
const osuBot = require('../../helpers/osuBot');
const Settings = require('../../models/settings');
const Mediation = require('../../models/mediation');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasBasicAccess);

//population
const defaultPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natBuddy', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId discordId isBnEvaluator' },
    { path: 'natEvaluators', select: 'username osuId discordId isBnEvaluator' },
    { path: 'mockEvaluators', select: 'username osuId discordId isBnEvaluator' },
    { 
        path: 'vibeChecks',
        select: 'mediator vote',
        populate: {
            path: 'mediator',
            select: 'username osuId groups',
        },
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat discordId isBnEvaluator',
        },
    },
    {
        path: 'mockReviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat discordId isBnEvaluator',
        },
    },
    {
        path: 'rerolls',
        populate: [
            {
                path: 'oldEvaluator',
                select: 'username osuId',
            },
            {
                path: 'newEvaluator',
                select: 'username osuId',
            },
        ],
    }
];

// hides all reviews other than current user
function getActiveBnDefaultPopulate(mongoId) {
    return [
        { path: 'user', select: 'username osuId' },
        { 
            path: 'vibeChecks',
            select: 'mediator vote',
            populate: {
                path: 'mediator',
                select: 'username osuId groups',
            },
        },
        {
            path: 'mockReviews',
            select: 'moddingComment vote',
            match: {
                evaluator: mongoId,
            },
            populate: {
                path: 'evaluator',
            },
        },
    ];
}

const inactiveBnDefaultPopulate = [
    { path: 'user', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'groups',
        },
    },
    {
        path: 'mockReviews',
        select: 'behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'groups',
        },
    },
];

/* GET applications listing. */
router.get('/relevantInfo', async (req, res) => {
    let applications = [];

    if (res.locals.userRequest.isNat) {
        applications = await AppEvaluation
            .find({
                active: true,
            })
            .populate(defaultPopulate)
            .sort({
                createdAt: 1,
            });
    } else if (res.locals.userRequest.isTrialNat) {
        const settings = await Settings.findOne({}); // there's only one
        const trialNatEnabledModeSettings = settings.modeSettings.filter(s => s.hasTrialNat == true);
        const trialNatModes = trialNatEnabledModeSettings.map(s => s.mode);
        
        applications = await AppEvaluation
            .find({
                active: true,
                $and: [
                    { mode: res.locals.userRequest.modes },
                    { mode: trialNatModes },
                ]
            })
            .populate(defaultPopulate)
            .sort({
                createdAt: 1,
            });
    } else {
        const [activeApplications, inactiveApplications] = await Promise.all([
            AppEvaluation
                .find({
                    mockEvaluators: req.session.mongoId,
                    active: true,
                    discussion: false,
                })
                .select(['active', 'user', 'discussion', 'mockReviews', 'mode', 'mods', 'reasons', 'oszs', 'createdAt', 'updatedAt', 'comment'])
                .populate(getActiveBnDefaultPopulate(req.session.mongoId))
                .sort({
                    createdAt: -1,
                }),
                AppEvaluation
                    .find({
                        mockEvaluators: req.session.mongoId,
                        discussion: true,
                        active: false,
                    })
                    .select(['active', 'user', 'discussion', 'mockReviews', 'mode', 'mods', 'reasons', 'oszs', 'createdAt', 'updatedAt', 'comment', 'consensus']) // "consensus" is the only difference
                    .populate(inactiveBnDefaultPopulate)
                    .sort({
                        createdAt: -1,
                    })
        ]);

        applications = activeApplications.concat(inactiveApplications);
    }

    res.json({
        evaluations: applications,
    });
});

/* POST manually create a bn application */
router.post('/AddApplication', middlewares.isNat, async (req, res) => {
    const username = req.body.username;
    const mode = req.body.mode;
    const comment = req.body.comment;

    if (!username || !mode) {
        return res.json({ error: 'No user or mode specified!' });
    }

    const user = await User.findByUsernameOrOsuId(username).orFail();

    // check if there's an active app of the same mode
    const currentBnApp = await AppEvaluation.findOne({
        user: user.id,
        mode,
        active: true,
    });

    if (currentBnApp) {
        return res.json({ error: 'User already has an active application for this mode!' });
    }

    // create app
    const newBnApp = await AppEvaluation.create({
        user: user.id,
        mode,
        mods: [],
        reasons: [],
        oszs: [],
        comment,
        isPublic: false,
    });

    if (!newBnApp) {
        return res.json({ error: 'Failed to process application!' });
    }

    // set NAT assignments
    const assignedNat = await User.getAssignedNat(mode, user.id);
    newBnApp.natEvaluators = assignedNat;

    let fields = [];
    let discordIds = [];

    const natList = assignedNat.map(n => n.username).join(', ');
    const natDiscordIds = assignedNat.map(n => n.discordId);
    discordIds = discordIds.concat(natDiscordIds);

    fields.push({
        name: 'Assigned NAT',
        value: natList,
    });

    // set trialNat assignments
    if (await Settings.getModeHasTrialNat(mode)) {
        const assignedTrialNat = await User.getAssignedTrialNat(mode);
        newBnApp.bnEvaluators = assignedTrialNat;
        const trialNatList = assignedTrialNat.map(n => n.username).join(', ');
        const trialNatDiscordIds = assignedTrialNat.map(n => n.discordId);
        fields.push({
            name: 'Assigned BN',
            value: trialNatList,
        });
        discordIds = discordIds.concat(trialNatDiscordIds);
    }

    // save all assignments
    await newBnApp.save();

    // NAT webhook
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Created [**${user.username}**'s BN application](http://bn.mappersguild.com/appeval?id=${newBnApp.id})`,
            color: discord.webhookColors.white,
            fields,
        }],
        mode
    );

    await discord.userHighlightWebhookPost(mode, discordIds);

    const applications = await AppEvaluation.findActiveApps();

    Logger.generate(
        req.session.mongoId,
        `Created a BN application for "${user.username}"`,
        'appEvaluation',
        newBnApp._id
    );

    res.json({
        applications,
        success: 'Created application!',
    });
});

/* POST submit or edit eval */
router.post('/submitEval/:id', middlewares.isBnOrNat, async (req, res) => {
    let evaluation = await AppEvaluation
        .findOne({
            _id: req.params.id,
            active: true,
        })
        .populate(defaultPopulate)
        .orFail();

    let isNewEvaluation;
    let isMockEvaluator = evaluation.mockEvaluators.some(u => u.id == req.session.mongoId);

    if (isMockEvaluator) {
        isNewEvaluation = await submitMockEval(
            evaluation,
            req.session,
            req.body.moddingComment,
            req.body.vote,
        );
    } else {
        if (!res.locals.userRequest.isNat && !res.locals.userRequest.isTrialNat) {
            return res.json({
                error: 'You cannot do this.',
            });
        }

        isNewEvaluation = await submitEval(
            evaluation,
            req.session,
            res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat,
            req.body.moddingComment,
            req.body.vote,
        );
    }

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        `${isNewEvaluation ? 'Submitted' : 'Updated'} ${evaluation.mode} BN app ${isMockEvaluator ? 'mock' : ''} evaluation for "${evaluation.user.username}"`,
        'appEvaluation',
        evaluation._id
    );
});

/* POST set group eval */
router.post('/setGroupEval/', middlewares.isNat, async (req, res) => {
    const evaluations = await AppEvaluation
        .find({
            _id: {
                $in: req.body.evalIds,
            },
        })
        .populate(defaultPopulate);

    await setGroupEval(evaluations, req.session);

    let a = await AppEvaluation.findActiveApps();
    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN app${req.body.evalIds.length == 1 ? '' : 's'} as group evaluation`,
        'appEvaluation'
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', middlewares.isNat, async (req, res) => {
    await AppEvaluation.updateMany({
        _id: { $in: req.body.evalIds },
    }, {
        discussion: false,
    });

    let a = await AppEvaluation.findActiveApps();

    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN app${req.body.evalIds.length == 1 ? '' : 's'} as individual evaluation`,
        'appEvaluation'
    );
});

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNatOrTrialNat, async (req, res) => {
    const evaluations = await AppEvaluation
        .find({
            _id: {
                $in: req.body.evalIds,
            },
            active: true,
        })
        .populate(defaultPopulate);

    for (const evaluation of evaluations) {
        let user = await User.findById(evaluation.user);

        if (evaluation.consensus === AppEvaluationConsensus.Pass) {
            let level = 'probation';
            let activityToCheck = 37;

            const skipProbation = evaluation.isRejoinRequest;

            if (skipProbation) {
                level = 'full';
                activityToCheck = Math.floor(Math.random() * (95 - 85) + 85); // between 85 and 95 days;
            }

            user.modesInfo.push({
                mode: evaluation.mode,
                level,
            });

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + activityToCheck);

            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck,
            });

            if (!user.isBn) {
                user.groups.push('bn');
            }

            user.history.push({
                date: new Date(),
                mode: evaluation.mode,
                kind: 'joined',
                group: 'bn',
                relatedEvaluation: evaluation._id,
            });

            user.lastOpenedForRequests = new Date();

            await user.save();

            const userOsuInfo = await osu.getOtherUserInfo(req.session.accessToken, user.osuId);

            if (!userOsuInfo.is_supporter) {
                await discord.roleHighlightWebhookPost(evaluation.mode, ['groupMovers'], 'give new BN supporter pls ');
                await util.sleep(500);
            }
        }

        evaluation.active = false;
        evaluation.archivedAt = new Date();
        await evaluation.save();

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.black,
                description: `Archived [**${user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) with **${evaluation.consensus === AppEvaluationConsensus.Pass ? 'Pass' : evaluation.consensus === AppEvaluationConsensus.Fail ? 'Fail' : 'no'}** consensus`,
            }],
            evaluation.mode
        );
        Logger.generate(
            req.session.mongoId,
            `Set ${user.username}'s ${evaluation.mode} application eval as "${evaluation.consensus}"`,
            'appEvaluation',
            evaluation._id
        );
    }

    const activeApps = await AppEvaluation.findActiveApps();

    res.json(activeApps);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN app${req.body.evalIds.length == 1 ? '' : 's'} as completed`,
        'appEvaluation'
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation.consensus = req.body.consensus;

    if (req.body.consensus === AppEvaluationConsensus.Fail) {
        let date = new Date(evaluation.createdAt);
        date.setDate(date.getDate() + 60);
        evaluation.cooldownDate = date;
    }

    await evaluation.save();

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        `Set consensus of ${evaluation.user.username}'s ${evaluation.mode} BN app as ${req.body.consensus}`,
        'appEvaluation',
        evaluation._id
    );

    const embed = [
        {
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightBlue,
            description: `[**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) consensus set to **${req.body.consensus || 'none'}**`,
        }
    ];

    await discord.webhookPost(embed, evaluation.mode);
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation = await setFeedback(evaluation, req.body.feedback, req.session);
    res.json(evaluation);
});

/* POST replace evaluator */
router.post('/replaceUser/:id', middlewares.isNat, async (req, res) => {
    const replaceNat = Boolean(req.body.replaceNat);
    let evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();
    let replacement;

    replacement = await replaceUser(evaluation, res.locals.userRequest.id, req.body.evaluatorId, !replaceNat, req.body.selectedUserId);
    await evaluation.save();

    evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        `Re-selected a ${replaceNat ? 'NAT' : 'BN'} evaluator on BN application for ${evaluation.user.username}`,
        'appEvaluation',
        evaluation._id
    );

    const user = await User.findById(req.body.evaluatorId);

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.orange,
            description: `Replaced **${user.username}** with **${replacement.username}**  as ${replaceNat ? 'NAT' : 'BN'} evaluator for [**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id})`,
        }],
        evaluation.mode
    );
});

/* POST select mock evaluators */
router.post('/selectMockEvaluators/:id', middlewares.isNat, async (req, res) => {
    const selectAll = req.body.selectAll;
    const evaluation = await AppEvaluation
        .findById(req.params.id)
        .orFail();

    const selectedUsers = await selectMockEvaluators(evaluation, selectAll);

    // Return selected users without saving to database
    res.json(selectedUsers);

    Logger.generate(
        req.session.mongoId,
        `Generated ${selectedUsers.length} potential mock evaluators for ${evaluation.user.username}'s ${evaluation.mode} BN app`,
        'appEvaluation',
        evaluation._id
    );
});

/* POST enable mock evaluators */
router.post('/enableMockEvaluators/:id', middlewares.isNat, async (req, res) => {
    const mockEvaluators = req.body.mockEvaluators || [];
    
    for (let i = 0; i < mockEvaluators.length; i++) {
        const mockEvaluator = mockEvaluators[i];
        const user = await User.findOne({ osuId: mockEvaluator.osuId });
        await AppEvaluation.findByIdAndUpdate(req.params.id, { $push: { mockEvaluators: user._id } });
    }

    let application = await AppEvaluation.findById(req.params.id).populate(defaultPopulate);

    res.json({
        application,
        success: 'Enabled mock evaluations',
    });

    Logger.generate(
        req.session.mongoId,
        `Enabled mock evaluations for ${mockEvaluators.length} BNs on ${application.user.username}'s ${application.mode} BN app`,
        'appEvaluation',
        application._id
    );
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightOrange,
            description: `Enabled mock evaluations for [**${application.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${application.id})`,
        }],
        application.mode
    );
});

/* POST send messages */
router.post('/sendMessages/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const application = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();


    req.body.users.push({ osuId: req.session.osuId });

    const osuIds = req.body.users.map(user => user.osuId);

    let channel;

    if (req.body.type == 'enable mock evaluations') {
        channel = {
            name: `BN App Mock Eval (${application.mode == 'osu' ? 'osu!' : `osu!${application.mode}`})`,
            description: `Invite to participate in a mock evaluation of a BN application`,
        }
    } else {
        channel = {
            name: `BN App Results (${application.mode == 'osu' ? 'osu!' : `osu!${application.mode}`})`,
            description: `Results for your recent BN application (${moment(application.createdAt).format('YYYY-MM-DD')})`,
        }
    }

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: `Messages were not sent. Please let pishifat know!` });
    }

    res.json({ success: 'Messages sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Sent **${req.body.type}** chat messages for BN app for "${application.user.username}"`,
        'appEvaluation',
        application._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.white,
        description: `Sent **${req.body.type}** chat messages for [**${application.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${application.id})`,
    }],
    application.mode);
});

/* POST toggle isReviewed for evaluations */
router.post('/toggleIsReviewed/:id', middlewares.isNat, async (req, res) => {
    const app = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);
        
    app.isReviewed = !app.isReviewed;
    await app.save();

    res.json(app);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.lightPurple,
        description: `${app.isReviewed ? 'Reviewed feedback for' : 'Unmarked feedback as reviewed for'} [**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id})`,
    }],
    app.mode);

    Logger.generate(
        req.session.mongoId,
        `Toggled "${app.user.username}" ${app.mode} BN app isReviewed to ${app.isReviewed}`,
        'appEvaluation',
        app._id
    );
});

/* POST toggle isSecurityChecked for evaluations */
router.post('/toggleIsSecurityChecked/:id', middlewares.isNat, async (req, res) => {
    const app = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);
        
    app.isSecurityChecked = !app.isSecurityChecked;
    await app.save();

    res.json(app);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkRed,
        description: `${app.isSecurityChecked ? 'Marked' : 'Unmarked'} [**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id}) as security checked`,
    }],
    app.mode);

    Logger.generate(
        req.session.mongoId,
        `Toggled "${app.user.username}" ${app.mode} BN app isSecurityChecked to ${app.isSecurityChecked}`,
        'appEvaluation',
        app._id
    );
});

/* POST assign natBuddy */
router.post('/assignNatBuddy/:appId/:userId', middlewares.isNat, async (req, res) => {
    const [app, nat] = await Promise.all([
        AppEvaluation
            .findById(req.params.appId)
            .populate(defaultPopulate)
            .orFail(),
        User
            .findById(req.params.userId)
            .orFail(),
    ]);
    
    app.natBuddy = nat._id;
    await app.save();

    await app.populate(defaultPopulate).execPopulate();

    res.json(app);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkGreen,
        description: `Assigned [${nat.username}](https://osu.ppy.sh/users/${nat.osuId}) as NAT buddy on [**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id})`,
    }],
    app.mode);

    Logger.generate(
        req.session.mongoId,
        `Assigned "${nat.username}" as NAT buddy on ${app.user.username}'s BN app`,
        'appEvaluation',
        app._id
    );
});

/* POST submit vibe check */
router.post('/submitVibeCheck/:id', middlewares.isBnOrNat, async (req, res) => {
    let evaluation = await AppEvaluation
        .findOne({
            _id: req.params.id,
            active: true,
        })
        .populate(defaultPopulate)
        .orFail();

    const mediation = new Mediation();
    mediation.mediator = req.session.mongoId;
    mediation.vote = req.body.vote;
    await mediation.save();

    evaluation.vibeChecks.push(mediation);
    await evaluation.save();

    evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        `Submitted vibe check for ${evaluation.mode} BN app for "${evaluation.user.username}"`,
        'appEvaluation',
        evaluation._id
    );
});

/* POST delete review */
router.post('/deleteReview/:id', middlewares.isAdmin, async (req, res) => {
    const app = await AppEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    const review = app.reviews.find(r => r._id == req.body.reviewId);

    if (!review) {
        return res.json({ error: 'Review not found' });
    }

    app.reviews.pull(review);
    await app.save();

    res.json(app);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted review by **${review.evaluator.username}** in [**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id})`,
    }],
    app.mode);

    Logger.generate(
        req.session.mongoId,
        `Deleted review by "${review.evaluator.username}" in ${app.mode} BN app for "${app.user.username}"`,
        'appEvaluation',
        app._id
    );
});

module.exports = router;
