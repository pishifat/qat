const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const User = require('../../models/user');
const Logger = require('../../models/log');
const { submitEval, setGroupEval, setFeedback, replaceUser } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const { AppEvaluationConsensus } = require('../../shared/enums');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasBasicAccess);

//population
const defaultPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

const bnDefaultPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'test', select: 'comment totalScore' },
    {
        path: 'reviews',
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

    if (res.locals.userRequest.hasFullReadAccess || res.locals.userRequest.isTrialNat) {
        applications = await AppEvaluation
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate(defaultPopulate)
            .sort({
                createdAt: 1,
            });
    } else {
        applications = await AppEvaluation
            .find({
                bnEvaluators: req.session.mongoId,
                test: { $exists: true },
                $or: [
                    { active: true, discussion: false },
                    { active: false, discussion: true },
                ],
            })
            .select(['active', 'user', 'discussion', 'reviews', 'mode', 'mods', 'reasons', 'consensus', 'createdAt', 'updatedAt'])
            .populate(
                bnDefaultPopulate
            )
            .sort({
                createdAt: -1,
            });
    }

    res.json({
        evaluations: applications,
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

    if (
        !res.locals.userRequest.isNat &&
        !res.locals.userRequest.isTrialNat &&
        !evaluation.bnEvaluators.some(bn => bn.id == req.session.mongoId)
    ) {
        return res.json({
            error: 'You cannot do this.',
        });
    }

    const isNewEvaluation = await submitEval(
        evaluation,
        req.session,
        res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat,
        req.body.behaviorComment,
        req.body.moddingComment,
        req.body.vote
    );

    evaluation = await AppEvaluation
        .findById(req.params.id)
        .populate(
            res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat ? defaultPopulate : bnDefaultPopulate
        );

    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `${isNewEvaluation ? 'Submitted' : 'Updated'} ${evaluation.mode} BN app evaluation for "${evaluation.user.username}"`,
        'appEvaluation',
        evaluation._id
    );
});

/* POST set group eval */
router.post('/setGroupEval/', middlewares.isNat, async (req, res) => {
    const evaluations = await AppEvaluation
        .find({
            _id: {
                $in: req.body.checkedApps,
            },
        })
        .populate(defaultPopulate);

    await setGroupEval(evaluations, req.session);

    let a = await AppEvaluation.findActiveApps();
    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as group evaluation`,
        'appEvaluation'
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', middlewares.isNat, async (req, res) => {
    await AppEvaluation.updateMany({
        _id: { $in: req.body.checkedApps },
    }, {
        discussion: false,
    });

    let a = await AppEvaluation.findActiveApps();

    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as individual evaluation`,
        'appEvaluation'
    );
});

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNat, async (req, res) => {
    const evaluations = await AppEvaluation
        .find({
            _id: {
                $in: req.body.checkedApps,
            },
            active: true,
        })
        .populate(defaultPopulate);

    for (const evaluation of evaluations) {
        let user = await User.findById(evaluation.user);

        if (evaluation.consensus === AppEvaluationConsensus.Pass) {
            user.modesInfo.push({
                mode: evaluation.mode,
                level: 'probation',
            });

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
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

            await user.save();
        }

        evaluation.active = false;
        evaluation.archivedAt = new Date();
        await evaluation.save();

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.black,
                description: `Archived [**${user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) with **${evaluation.consensus === AppEvaluationConsensus.Pass ? 'Pass' : 'Fail'}** consensus`,
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
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as completed`,
        'appEvaluation'
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluation = await AppEvaluation
        .findByIdAndUpdate(req.params.id, { consensus: req.body.consensus })
        .populate(defaultPopulate)
        .orFail();

    if (req.body.consensus === AppEvaluationConsensus.Fail) {
        let date = new Date(evaluation.createdAt);
        date.setDate(date.getDate() + 90);
        evaluation.cooldownDate = date;
        await evaluation.save();
    }

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        `Set consensus of ${evaluation.user.username}'s ${evaluation.mode} BN app as ${req.body.consensus}`,
        'appEvaluation',
        evaluation._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightBlue,
            description: `[**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) set to **${req.body.consensus}**`,
        }],
        evaluation.mode
    );
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', middlewares.isNat, async (req, res) => {
    const evaluation = await AppEvaluation
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${evaluation.user.username}'s ${evaluation.mode} BN app`,
        'appEvaluation',
        evaluation._id
    );
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkBlue,
            description: `Re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}** from [**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id})`,
        }],
        evaluation.mode
    );
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

    if (replaceNat) {
        replacement = await replaceUser(evaluation, res.locals.userRequest, req.body.evaluatorId);
    } else {
        let invalids = evaluation.bnEvaluators.map(bn => bn.osuId);
        const evaluatorArray = await User.aggregate([
            {
                $match: {
                    groups: 'bn',
                    modesInfo: { $elemMatch: { mode: evaluation.mode, level: 'full' } },
                    osuId: { $nin: invalids },
                    isBnEvaluator: true,
                },
            },
            { $sample: { size: 1 } },
        ]);
        replacement = evaluatorArray[0];

        const i = evaluation.bnEvaluators.findIndex(e => e.id == req.body.evaluatorId);
        evaluation.bnEvaluators.splice(i, 1, replacement._id);
        await evaluation.save();
    }

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

/* POST select BN evaluators */
router.post('/selectBnEvaluators', middlewares.isNat, async (req, res) => {
    const allUsers = await User.aggregate([
        {
            $match: {
                groups: 'bn',
                isBnEvaluator: true,
                modesInfo: { $elemMatch: { mode: req.body.mode, level: 'full' } },
            },
        },
        { $sample: { size: 1000 } },
    ]);
    let users = [];
    let excludeUserIds = [];

    if (req.body.includeUsers) {
        const includeUsers = req.body.includeUsers.split(',');

        for (let i = 0; i < includeUsers.length; i++) {
            const userToSearch = includeUsers[i].trim();
            const user = await User.findByUsername(userToSearch);

            if (user && user.modesInfo.some(m => m.mode === req.body.mode)) {
                users.push(user);
                excludeUserIds.push(user.id);
            }
        }
    }


    if (req.body.excludeUsers) {
        const excludeUsers = req.body.excludeUsers.split(',');

        for (let i = 0; i < excludeUsers.length; i++) {
            const userToSearch = excludeUsers[i].trim();
            const user = await User.findByUsername(userToSearch);

            if (user) {
                excludeUserIds.push(user.id);
            }
        }
    }

    const modeUsers = req.body.mode == 'osu' ? 6 : 3;

    const requiredUsers = users.length > modeUsers ? users.length : modeUsers;

    for (let i = 0; users.length < requiredUsers && i < allUsers.length; i++) {
        const user = allUsers[i];
        const userId = user._id.toString();

        if (!excludeUserIds.includes(userId)) {
            users.push(user);
            excludeUserIds.push(userId);
        }
    }

    res.json(users);
});

/* POST begin BN evaluations */
router.post('/enableBnEvaluators/:id', middlewares.isNat, async (req, res) => {
    for (let i = 0; i < req.body.bnEvaluators.length; i++) {
        let bn = req.body.bnEvaluators[i];
        await AppEvaluation.findByIdAndUpdate(req.params.id, { $push: { bnEvaluators: bn._id } });
    }

    let application = await AppEvaluation.findById(req.params.id).populate(defaultPopulate);
    res.json({
        application,
        success: 'Enabled BN evaluators',
    });

    Logger.generate(
        req.session.mongoId,
        `Opened a BN app to evaluation from ${req.body.bnEvaluators.length} current BNs.`,
        'appEvaluation',
        application._id
    );
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightOrange,
            description: `Enabled BN evaluators for [**${application.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${application.id})`,
        }],
        application.mode
    );
});

module.exports = router;
