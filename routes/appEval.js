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
    let a;
    if(res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator){
        a = await bnAppsService.query(
            { active: true, test: { $exists: true } },
            defaultPopulate,
            { createdAt: 1, consensus: 1, feedback: 1  },
            true
        );
    }else{
        a = await bnAppsService.query(
            { active: true, test: { $exists: true }, bnEvaluators: { $elemMatch: { $in: res.locals.userRequest.id } } },
            defaultPopulate,
            { createdAt: 1, consensus: 1, feedback: 1  },
            true
        );
    }
    
    res.json({ a, evaluator: res.locals.userRequest });
});

/* POST submit or edit eval */
router.post('/submitEval/:id', async (req, res) => {
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
                        value: `submitted BN app eval for **${a.applicant.username}**`,
                    },
                ],
            }], 
            a.mode
        );
        
        if(!a.discussion && ((a.mode == 'osu' && a.evaluations.length > 2) || (a.mode != 'osu' && a.evaluations.length > 1))){
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
            if((a.mode == 'osu' && nat > 1) || (a.mode != 'osu' && nat > 1)){
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
                                value: 'Moved BN app to group discussion',
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
router.post('/setGroupEval/', api.isLeader, async (req, res) => {
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
                        value: `Moved ${a.applicant.username}**'s BN app to group discussion`,
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
router.post('/setIndividualEval/', api.isLeader, async (req, res) => {
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
router.post('/setComplete/', api.isLeader, async (req, res) => {
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
                        value: `archived **${u.username}**'s BN app`,
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
router.post('/setConsensus/:id', async (req, res) => {
    await bnAppsService.update(req.params.id, { consensus: req.body.consensus });
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
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

/* POST set feedback of eval */
router.post('/setFeedback/:id', async (req, res) => {
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
                    value: `**${a.applicant.username}'s feedback**: ${req.body.feedback.length > 990 ? req.body.feedback.slice(0,990) + '... *(truncated)*' : req.body.feedback}`,
                },
            ],
        }], 
        a.mode
    );
});

/* POST toggle priority */
router.post('/toggleIsPriority/:id', async (req, res) => {
    await bnAppsService.update(req.params.id, { isPriority: !req.body.isPriority });
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Toggled priority for ${a.applicant.username}'s ${a.mode} BN app`
    );
});

/* POST select BN evaluators */
router.post('/selectBnEvaluators', async (req, res) => {
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
});

module.exports = router;
