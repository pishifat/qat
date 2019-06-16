const express = require('express');
const api = require('../models/api');
const bnAppsService = require('../models/bnApp').service;
const evalsService = require('../models/evaluation').service;
const evalRoundsService = require('../models/evalRound').service;
const usersModel = require('../models/user').User;
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('evaluations/appeval', {
        title: 'BN Application Evaluations',
        script: '../javascripts/appEval.js',
        isEval: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { populate: 'applicant', display: 'username osuId' },
    { populate: 'bnEvaluators', display: 'username osuId' },
    { populate: 'test', display: 'totalScore' },
    {
        populate: 'evaluations',
        display: 'evaluator behaviorComment moddingComment vote',
    },
    {
        innerPopulate: 'evaluations',
        populate: { path: 'evaluator', select: 'username osuId' },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    const a = 
        await bnAppsService.query(
            { active: true, test: { $exists: true } },
            defaultPopulate,
            { createdAt: 1, consensus: 1, feedback: 1  },
            true
        );
    res.json({ a: a, evaluator: res.locals.userRequest });
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
        let app = await bnAppsService.update(req.params.id, { $push: { evaluations: ev._id } });
        if((app.mode == 'osu' && app.evaluations.length > 2) || (app.mode != 'osu' && app.evaluations.length > 1)){
            await bnAppsService.update(req.params.id, { discussion: true });
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
                await usersService.update(u.id, { $push: {bnDuration: new Date() }});
            }
        }
        await bnAppsService.update(a.id, { active: false });
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
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', async (req, res) => {
    await bnAppsService.update(req.params.id, { feedback: req.body.feedback });
    let a = await bnAppsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(a);
    logsService.create(
        req.session.mongoId,
        `Edited feedback of ${a.applicant.username}'s ${a.mode} BN app`
    );
});

/* POST set status upheld or withdrawn. */
router.post('/selectBnEvaluators', async (req, res, next) => {
    const allUsers = await usersModel.aggregate([
        { $match: { group: { $eq: 'bn' }, isBnEvaluator: true} },
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
router.post('/enableBnEvaluators/:id', api.isLeader, async (req, res, next) => {
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
