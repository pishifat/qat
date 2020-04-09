const express = require('express');
const api = require('../helpers/api');
const BnApp = require('../models/bnApp');
const Evaluation = require('../models/evaluation');
const EvalRound = require('../models/evalRound');
const User = require('../models/user');
const Logger = require('../models/log');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('evaluations/appeval', {
        title: 'BN Application Evaluations',
        script: '../javascripts/appEval.js',
        isEval: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { path: 'applicant', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    {
        path: 'evaluations',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let a = [];

    if (res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator) {
        a = await BnApp
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate(defaultPopulate)
            .sort({
                createdAt: 1,
                consensus: 1,
                feedback: 1,
            });
    } else {
        a = await BnApp
            .find({
                test: { $exists: true },
                bnEvaluators: req.session.mongoId,
            })
            .populate(defaultPopulate)
            .sort({
                createdAt: 1,
                consensus: 1,
                feedback: 1,
            });
    }

    res.json({ a, evaluator: res.locals.userRequest });
});

/* POST submit or edit eval */
router.post('/submitEval/:id', async (req, res) => {
    if (res.locals.userRequest.isSpectator && res.locals.userRequest.group != 'bn') {
        return res.json({ error: 'Spectators cannot perform this action!' });
    }

    if (req.body.evaluationId) {
        await Evaluation.findByIdAndUpdate(req.body.evaluationId, {
            behaviorComment: req.body.behaviorComment,
            moddingComment: req.body.moddingComment,
            vote: req.body.vote,
        });
    } else {
        const ev = await Evaluation.create({
            evaluator: req.session.mongoId,
            behaviorComment: req.body.behaviorComment,
            moddingComment: req.body.moddingComment,
            vote: req.body.vote,
        });
        const a = await BnApp
            .findByIdAndUpdate(req.params.id, { $push: { evaluations: ev._id } })
            .populate(defaultPopulate);

        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.lightGreen,
                description: `Submitted eval for [**${a.applicant.username}**'s BN application](http://bn.mappersguild.com/appeval?eval=${a.id})`,
            }],
            a.mode
        );
        const twoEvaluationModes = ['catch', 'mania'];
        const threeEvaluationModes = ['osu', 'taiko'];

        if (!a.discussion && ((threeEvaluationModes.includes(a.mode) && a.evaluations.length > 2) || (twoEvaluationModes.includes(a.mode) && a.evaluations.length > 1))) {
            let pass = 0;
            let neutral = 0;
            let fail = 0;
            let nat = 0;
            a.evaluations.forEach(evaluation => {
                if (evaluation.evaluator.group == 'nat') nat++;
                if (evaluation.vote == 1) pass++;
                else if (evaluation.vote == 2) neutral++;
                else if (evaluation.vote == 3) fail++;
            });

            if ((threeEvaluationModes.includes(a.mode) && nat > 2) || (twoEvaluationModes.includes(a.mode) && nat > 1)) {
                await BnApp.findByIdAndUpdate(req.params.id, { discussion: true });

                api.webhookPost(
                    [{
                        thumbnail: {
                            url: `https://a.ppy.sh/${a.applicant.osuId}`,
                        },
                        color: api.webhookColors.gray,
                        description: `[**${a.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id}) moved to group discussion`,
                        fields: [
                            {
                                name: 'Votes',
                                value: `Pass: **${pass}**, Neutral: **${neutral}**, Fail: **${fail}**`,
                            },
                        ],
                    }],
                    a.mode
                );
            }
        }
    }

    let a = await BnApp.findById(req.params.id).populate(defaultPopulate);
    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `${req.body.evaluationId ? 'Updated' : 'Submitted'} ${a.mode} BN app evaluation for "${a.applicant.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        const a = await BnApp
            .findByIdAndUpdate(req.body.checkedApps[i], { discussion: true })
            .populate(defaultPopulate);

        let pass = 0;
        let neutral = 0;
        let fail = 0;

        a.evaluations.forEach(evaluation => {
            if (evaluation.vote == 1) pass++;
            else if (evaluation.vote == 2) neutral++;
            else if (evaluation.vote == 3) fail++;
        });

        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.lightRed,
                description: `Moved [**${a.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id}) to group discussion`,
                fields: [
                    {
                        name: 'Votes',
                        value: `Pass: **${pass}**, Neutral: **${neutral}**, Fail: **${fail}**`,
                    },
                ],
            }],
            a.mode
        );
    }

    let a = await BnApp.findActiveApps();
    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', api.isNat, async (req, res) => {
    await BnApp.updateMany({
        _id: { $in: req.body.checkedApps },
    }, {
        discussion: false,
    });

    let a = await BnApp.findActiveApps();

    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        let app = await BnApp.findById(req.body.checkedApps[i]);
        let applicant = await User.findById(app.applicant);

        if (app.consensus == 'pass') {
            await User.findByIdAndUpdate(applicant.id, {
                $push: {
                    modes: app.mode,
                    probation: app.mode,
                },
            });

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await EvalRound.create({
                bn: app.applicant,
                mode: app.mode,
                deadline,
            });

            if (applicant.group == 'user') {
                await User.findByIdAndUpdate(applicant.id, {
                    group: 'bn',
                    $push: { bnDuration: new Date() },
                });
            }
        }

        app.active = false;
        await app.save();

        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.black,
                description: `Archived [**${applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${app.id}) with **${app.consensus == 'pass' ? 'Pass' : 'Fail'}** consensus`,
            }],
            app.mode
        );
        Logger.generate(
            req.session.mongoId,
            `Set ${applicant.username}'s ${app.mode} application eval as "${app.consensus}"`
        );
    }

    const activeApps = await BnApp.findActiveApps();

    res.json(activeApps);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let a = await BnApp
        .findByIdAndUpdate(req.params.id, { consensus: req.body.consensus })
        .populate(defaultPopulate);

    if (req.body.consensus == 'fail') {
        let date = new Date(a.createdAt);
        date.setDate(date.getDate() + 90);
        a.cooldownDate = date;
        await a.save();
    }

    res.json(a);

    Logger.generate(
        req.session.mongoId,
        `Set consensus of ${a.applicant.username}'s ${a.mode} BN app as ${req.body.consensus}`
    );

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.lightBlue,
            description: `[**${a.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id}) set to **${req.body.consensus}**`,
        }],
        a.mode
    );
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', api.isNotSpectator, async (req, res) => {
    const a = await BnApp
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

    res.json(a);

    Logger.generate(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${a.applicant.username}'s ${a.mode} BN app`
    );

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.darkBlue,
            description: `**${a.applicant.username}**'s re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}**`,
        }],
        a.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    const a = await BnApp
        .findByIdAndUpdate(req.params.id, { feedback: req.body.feedback })
        .populate(defaultPopulate);

    res.json(a);

    if (!req.body.hasFeedback) {
        Logger.generate(
            req.session.mongoId,
            `Created feedback for ${a.applicant.username}'s ${a.mode} BN app`
        );
        BnApp.findByIdAndUpdate(req.params.id, { feedbackAuthor: req.session.mongoId });
    } else {
        Logger.generate(
            req.session.mongoId,
            `Edited feedback of ${a.applicant.username}'s ${a.mode} BN app`
        );
    }

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.blue,
            description: `[**${a.applicant.username}'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id}) feedback**: ${req.body.feedback.length > 925 ? req.body.feedback.slice(0,925) + '... *(truncated)*' : req.body.feedback}`,
        }],
        a.mode
    );
});

/* POST replace evaluator */
router.post('/replaceUser/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    const isNat = Boolean(req.body.isNat);
    let a = await BnApp.findById(req.params.id).populate(defaultPopulate);
    let newEvaluator;

    if (isNat) {
        const invalids = [8129817, 3178418];
        a.natEvaluators.forEach(user => {
            invalids.push(user.osuId);
        });
        newEvaluator = await User.aggregate([
            { $match: { group: 'nat', isSpectator: { $ne: true }, modes: a.mode, osuId: { $nin: invalids } } },
            { $sample: { size: 1 } },
        ]);

        await Promise.all([
            BnApp.findByIdAndUpdate(req.params.id, {
                $push: { natEvaluators: newEvaluator[0]._id },
            }),
            BnApp.findByIdAndUpdate(req.params.id, {
                $pull: { natEvaluators: req.body.evaluatorId },
            }),
        ]);
    } else {
        let invalids = [];
        a.bnEvaluators.forEach(user => {
            invalids.push(user.osuId);
        });
        newEvaluator = await User.aggregate([
            { $match: { group: 'bn', isSpectator: { $ne: true }, modes: a.mode, osuId: { $nin: invalids }, isBnEvaluator: true, probation: { $size: 0 } } },
            { $sample: { size: 1 } },
        ]);

        await Promise.all([
            BnApp.findByIdAndUpdate(req.params.id, {
                $push: { bnEvaluators: newEvaluator[0]._id },
            }),
            BnApp.findByIdAndUpdate(req.params.id, {
                $pull: { bnEvaluators: req.body.evaluatorId },
            }),
        ]);
    }

    a = await BnApp.findById(req.params.id).populate(defaultPopulate);

    res.json(a);

    Logger.generate(
        req.session.mongoId,
        `Re-selected a ${isNat ? 'NAT' : 'BN'} evaluator on BN application for ${a.applicant.username}`
    );

    const user = await User.findById(req.body.evaluatorId);

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.orange,
            description: `Replaced **${user.username}** with **${newEvaluator[0].username}**  as ${isNat ? 'NAT' : 'BN'} evaluator for [**${a.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id})`,
        }],
        a.mode
    );
});

/* POST select BN evaluators */
router.post('/selectBnEvaluators', api.isNat, async (req, res) => {
    const allUsers = await User.aggregate([
        { $match: { group: { $eq: 'bn' }, isBnEvaluator: true, probation: { $size: 0 }, modes: req.body.mode }  },
        { $sample: { size: 1000 } },
    ]);
    let users = [];
    let excludeUserIds = [];
    const requiredUsers = req.body.mode == 'osu' ? 6 : 3;

    if (req.body.includeUsers) {
        const includeUsers = req.body.includeUsers.split(',');

        for (let i = 0; i < includeUsers.length && users.length < requiredUsers; i++) {
            const userToSearch = includeUsers[i].trim();
            const user = await User.findByUsername(userToSearch);

            if (user && !user.error && user.modes.includes(req.body.mode)) {
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

            if (user && !user.error) {
                excludeUserIds.push(user.id);
            }
        }
    }

    for (let i = 0; users.length < requiredUsers; i++) {
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
router.post('/enableBnEvaluators/:id', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.bnEvaluators.length; i++) {
        let bn = req.body.bnEvaluators[i];
        await BnApp.findByIdAndUpdate(req.params.id, { $push: { bnEvaluators: bn._id } });
    }

    let a = await BnApp.findById(req.params.id).populate(defaultPopulate);
    res.json(a);
    Logger.generate(
        req.session.mongoId,
        `Opened a BN app to evaluation from ${req.body.bnEvaluators.length} current BNs.`
    );
    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.lightOrange,
            description: `Enabled BN evaluators for [**${a.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${a.id})`,
        }],
        a.mode
    );
});

module.exports = router;
