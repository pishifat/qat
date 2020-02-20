const express = require('express');
const api = require('../helpers/api');
const bnAppsService = require('../models/bnApp').service;
const evalsService = require('../models/evaluation').service;
const evalRoundsService = require('../models/evalRound').service;
const usersModel = require('../models/user').User;
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;

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
    { populate: 'applicant', display: 'username osuId' },
    { populate: 'bnEvaluators', display: 'username osuId' },
    { populate: 'natEvaluators', display: 'username osuId' },
    { populate: 'test', display: 'totalScore comment' },
    {
        populate: 'evaluations',
        display: 'evaluator behaviorComment moddingComment vote',
    },
    {
        innerPopulate: 'evaluations',
        populate: { path: 'evaluator', select: 'username osuId group' },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let a = [];
    if(res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator){
        a = await bnAppsService.query(
            { active: true, test: { $exists: true } },
            defaultPopulate,
            { createdAt: 1, consensus: 1, feedback: 1  },
            true
        );
    }else{
        a = await bnAppsService.query(
            { test: { $exists: true }, bnEvaluators: req.session.mongoId },
            defaultPopulate,
            { createdAt: 1, consensus: 1, feedback: 1  },
            true
        );
    }
    
    res.json({ a, evaluator: res.locals.userRequest });
});

/* POST submit or edit eval */
router.post('/submitEval/:id', api.isNotSpectator, async (req, res) => {
    if (req.body.evaluationId) {
        await evalsService.update(req.body.evaluationId, {
            behaviorComment: req.body.behaviorComment,
            moddingComment: req.body.moddingComment,
            vote: req.body.vote,
        });
    } else {
        let ev = await evalsService.create(
            req.session.mongoId,
            req.body.behaviorComment,
            req.body.moddingComment,
            req.body.vote
        );
        await bnAppsService.update(req.params.id, { $push: { evaluations: ev._id } });
        let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '3800465',
                fields:[
                    {
                        name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                        value: `Submitted BN app eval for **${a.applicant.username}**`,
                    },
                ],
            }], 
            a.mode
        );
        let twoEvaluationModes = ['taiko', 'mania'];
        let threeEvaluationModes = ['osu', 'catch'];
        if(!a.discussion && ((threeEvaluationModes.includes(a.mode) && a.evaluations.length > 2) || (twoEvaluationModes.includes(a.mode) && a.evaluations.length > 1))){
            let pass = 0;
            let neutral = 0;
            let fail = 0;
            let nat = 0;
            a.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.group == 'nat') nat++;
                if(evaluation.vote == 1) pass++;
                else if(evaluation.vote == 2) neutral++;
                else if(evaluation.vote == 3) fail++;
            });
            if((threeEvaluationModes.includes(a.mode) && nat > 2) || (twoEvaluationModes.includes(a.mode) && nat > 1)){
                await bnAppsService.update(req.params.id, { discussion: true });
                api.webhookPost(
                    [{
                        author: {
                            name: `${a.applicant.username}`,
                            url: `https://osu.ppy.sh/users/${a.applicant.osuId}`,
                        },
                        thumbnail: {
                            url:  `https://a.ppy.sh/${a.applicant.osuId}`,
                        },
                        color: '3773329',
                        fields:[
                            {
                                name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                                value: 'BN app moved to group discussion',
                            },
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
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `${req.body.evaluationId ? 'Updated' : 'Submitted'} ${a.mode} BN app evaluation for "${a.applicant.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        await bnAppsService.update(req.body.checkedApps[i], { discussion: true });
        let a = await bnAppsService.query({ _id: req.body.checkedApps[i] }, defaultPopulate);
        let pass = 0;
        let neutral = 0;
        let fail = 0;
        a.evaluations.forEach(evaluation => {
            if(evaluation.vote == 1) pass++;
            else if(evaluation.vote == 2) neutral++;
            else if(evaluation.vote == 3) fail++;
        });
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '3773329',
                fields:[
                    {
                        name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                        value: `Moved **${a.applicant.username}**'s BN app to group discussion`,
                    },
                    {
                        name: 'Votes',
                        value: `Pass: **${pass}**, Neutral: **${neutral}**, Fail: **${fail}**`,
                    },
                ],
            }], 
            a.mode
        );
    }

    let a = await bnAppsService.query({ active: true }, defaultPopulate, { deadline: 1 }, true);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        await bnAppsService.update(req.body.checkedApps[i], { discussion: false });
    }

    let a = await bnAppsService.query({ active: true }, defaultPopulate, { deadline: 1 }, true);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        let a = await bnAppsService.query({ _id: req.body.checkedApps[i] });
        let u = await usersService.query({ _id: a.applicant });
        if (a.consensus == 'pass') {
            await usersService.update(u.id, { $push: { modes: a.mode } });
            await usersService.update(u.id, { $push: { probation: a.mode } });
            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await evalRoundsService.create(a.applicant, a.mode, deadline);
            if (u.group == 'user') {
                await usersService.update(u.id, { group: 'bn' });
                await usersService.update(u.id, { $push: { bnDuration: new Date() } });
            }
        }
        await bnAppsService.update(a.id, { active: false });
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '6579298',
                fields:[
                    {
                        name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                        value: `Archived **${u.username}**'s BN app`,
                    },
                    {
                        name: 'Consensus',
                        value: `${a.consensus == 'pass' ? 'Pass' : 'Fail'}`,
                    },
                ],
            }], 
            a.mode
        );
        logsService.create(
            req.session.mongoId,
            `Set ${u.username}'s ${a.mode} application eval as "${a.consensus}"`
        );
    }

    let a = await bnAppsService.query({ active: true }, defaultPopulate, { deadline: 1 }, true);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedApps.length} BN app${req.body.checkedApps.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let a = await bnAppsService.update(req.params.id, { consensus: req.body.consensus });
    if(req.body.consensus == 'fail'){
        let date = new Date(a.createdAt);
        date.setDate(date.getDate() + 90);
        await bnAppsService.update(req.params.id, { cooldownDate: date });
    }
    a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Set consensus of ${a.applicant.username}'s ${a.mode} BN app as ${req.body.consensus}`
    );
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '13272813',
            fields:[
                {
                    name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                    value: `**${a.applicant.username}**'s BN app set to **${req.body.consensus}**`,
                },
            ],
        }], 
        a.mode
    );
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', api.isNotSpectator, async (req, res) => {
    await bnAppsService.update(req.params.id, { cooldownDate: req.body.cooldownDate });
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${a.applicant.username}'s ${a.mode} BN app`
    );
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '16631799',
            fields:[
                {
                    name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                    value: `**${a.applicant.username}**'s re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}**`,
                },
            ],
        }], 
        a.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    await bnAppsService.update(req.params.id, { feedback: req.body.feedback });
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    if(!req.body.hasFeedback){
        logsService.create(
            req.session.mongoId,
            `Created feedback for ${a.applicant.username}'s ${a.mode} BN app`
        );
        bnAppsService.update(req.params.id, { feedbackAuthor: req.session.mongoId });
    }else{
        logsService.create(
            req.session.mongoId,
            `Edited feedback of ${a.applicant.username}'s ${a.mode} BN app`
        );
    }
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '5762129',
            fields:[
                {
                    name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                    value: `**${a.applicant.username}'s feedback**: ${req.body.feedback.length > 975 ? req.body.feedback.slice(0,975) + '... *(truncated)*' : req.body.feedback}`,
                },
            ],
        }], 
        a.mode
    );
});

/* POST replace evaluator */
router.post('/replaceUser/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    let isNat = Boolean(req.body.isNat);
    let newEvaluator;
    if(isNat){
        let invalids = [8129817, 3178418];
        a.natEvaluators.forEach(user => {
            invalids.push(user.osuId);
        });
        newEvaluator = await usersModel.aggregate([
            { $match: { group: 'nat', isSpectator: { $ne: true }, modes: a.mode, osuId: { $nin: invalids } } },
            { $sample: { size: 1 } },
        ]);
        await bnAppsService.update(req.params.id, { $push: { natEvaluators: newEvaluator[0]._id } });
        await bnAppsService.update(req.params.id, { $pull: { natEvaluators: req.body.evaluatorId } });
    }else{
        let invalids = [];
        a.bnEvaluators.forEach(user => {
            invalids.push(user.osuId);
        });
        newEvaluator = await usersModel.aggregate([
            { $match: { group: 'bn', isSpectator: { $ne: true }, modes: a.mode, osuId: { $nin: invalids }, isBnEvaluator: true } },
            { $sample: { size: 1 } },
        ]);
        await bnAppsService.update(req.params.id, { $push: { bnEvaluators: newEvaluator[0]._id } });
        await bnAppsService.update(req.params.id, { $pull: { bnEvaluators: req.body.evaluatorId } });
    }
    a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        'Re-selected a single evaluator'
    );
    let u = await usersService.query({ _id: req.body.evaluatorId });
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '16747310',
            fields:[
                {
                    name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                    value: `**${newEvaluator[0].username}** replaced **${u.username}** as ${isNat ? 'NAT' : 'BN'} evaluator for **${a.applicant.username}**'s BN app`,
                },
            ],
        }], 
        a.mode
    );
});

/* POST select BN evaluators */
router.post('/selectBnEvaluators', api.isLeader, async (req, res) => {
    const allUsers = await usersModel.aggregate([
        { $match: { group: { $eq: 'bn' }, isBnEvaluator: true, probation: { $size: 0 } }  },
        { $sample: { size: 1000 } },
    ]);
    let usernames = [];
    for (let i = 0; i < allUsers.length; i++) {
        let user = allUsers[i];
        if (
            user.modes.indexOf(req.body.mode) >= 0 &&
            user.probation.indexOf(req.body.mode) < 0
        ) {
            usernames.push(user);
            if (usernames.length >= (req.body.mode == 'osu' ? 6 : 3)) {
                break;
            }
        }
    }
    res.json(usernames);
});

/* POST begin BN evaluations */
router.post('/enableBnEvaluators/:id', api.isLeader, async (req, res) => {
    for (let i = 0; i < req.body.bnEvaluators.length; i++) {
        let bn = req.body.bnEvaluators[i];
        await bnAppsService.update(req.params.id, { $push: { bnEvaluators: bn._id } });
    }
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Opened a BN app to evaluation from ${req.body.bnEvaluators.length} current BNs.`
    );
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '3115512',
            fields:[
                {
                    name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                    value: `Enabled BN evaluators for **${a.applicant.username}**`,
                },
            ],
        }], 
        a.mode
    );
});

module.exports = router;
