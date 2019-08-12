const express = require('express');
const helper = require('./helper');
const api = require('../models/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;
const bnAppsService = require('../models/bnApp').service;
const evalsService = require('../models/evaluation').service;
const aiessService = require('../models/aiess').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('users', {
        title: 'BN/NAT Listing',
        script: '../javascripts/users.js',
        isUsers: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let u = await usersService.query(
        { $or: [{ group: 'nat' }, { group: 'bn' }], isSpectator: { $ne: true }  },
        {},
        { username: 1 },
        true
    );
    res.json({ users: u, userId: req.session.mongoId, isLeader: res.locals.userRequest.isLeader, isNat: res.locals.userRequest.group == 'nat' });
});

/* POST submit or edit eval */
router.post('/switchMediator/', api.isLeader, async (req, res) => {
    let u = await usersService.update(req.body.userId, {
        vetoMediator: !req.body.vetoMediator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.username} ${u.vetoMediator ? 'in to' : 'out of'} veto mediation`);
});

/* POST submit or edit eval */
router.post('/switchBnEvaluator/', api.isBnOrNat, async (req, res) => {
    let u = await usersService.update(req.session.mongoId, {
        isBnEvaluator: !res.locals.userRequest.isBnEvaluator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`);
});

/* POST switch usergroup */
router.post('/switchGroup/:id', api.isLeader, async (req, res) => {
    let u = await usersService.update(req.params.id, { group: req.body.group,  probation: [], $push: {bnDuration: new Date(), natDuration: new Date()} });
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Changed usergroup of "${u.username}" to "${req.body.group.toUpperCase()}"`
    );
});

/* POST remove from BN/NAT without evaluation */
router.post('/removeGroup/:id', api.isLeader, async (req, res) => {
    let u = await usersService.query({_id: req.params.id});
    let logGroup = u.group;
    if(u.group == 'bn'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: {bnDuration: new Date()} });
    }else if(u.group == 'nat'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: {natDuration: new Date()} });
    }
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Removed "${u.username}" from the ${logGroup.toUpperCase()}`
    );
});

/* GET all users with badge info */
router.get('/findUserBadgeInfo', async (req, res, next) => {
    let u = await usersService.query(
        { $or: [{ 'bnDuration.0': { $exists: true } }, { 'natDuration.0': { $exists: true } }] },
        {},
        { username: 1 },
        true
    );
    res.json(u);
});

/* POST remove from BN/NAT without evaluation */
router.post('/editBadgeValue/:id', api.isLeader, async (req, res) => {
    let u = await usersService.query({ _id: req.params.id });
    if(res.locals.userRequest.osuId == '3178418'){ //i dont want anyone else messing with this
        let years;
        let num = req.body.add ? 1 : -1
        if(req.body.group == 'bn'){
            years = u.bnProfileBadge + num;
            await usersService.update(req.params.id, { bnProfileBadge: years });
        }else{
            years = u.natProfileBadge + num;
            await usersService.update(req.params.id, { natProfileBadge: years });
        }
    }
    u = await usersService.query({ _id: req.params.id });
    res.json(u);
    
});

/* GET NAT activity */
router.get('/findNatActivity/:days', async (req, res, next) => {
    const [users, evaluations] = await Promise.all([
        usersService.query({ 
            group: 'nat', 
            $or: [
                { isSpectator: false }, 
                { isSpectator: { $exists: false } }
            ] }, 
            {}, {username: 1}, true),
            await evalsService.query({}, {}, {}, true)
    ]);

    class obj 
    {
        constructor(username, osuId, mode, totalEvaluations) 
        {
            this.username = username;
            this.osuId = osuId;
            this.mode = mode;
            this.totalEvaluations = totalEvaluations;
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - req.params.days);
    let info = [];
    users.forEach(user => {
        let count = 0;
        evaluations.forEach(evaluation => {
            if(evaluation.evaluator.toString() == user.id && evaluation.createdAt > minDate){
                count++;
            }     
        });
        info.push(new obj(user.username, user.osuId, user.modes[0], count));
    });

    res.json(info);
});

/* GET BN activity */
router.get('/findBnActivity/:days', async (req, res, next) => {
    class obj 
    {
        constructor(username, osuId, modes, uniqueNominations, nominationResets, beatmapReports) 
        {
            this.username = username;
            this.osuId = osuId;
            this.modes = modes;
            this.uniqueNominations = uniqueNominations;
            this.nominationResets = nominationResets;
            this.beatmapReports = beatmapReports;
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - req.params.days);
    let maxDate = new Date();
    const [users, allEvents] = await Promise.all([
        usersService.query({ 
            group: 'bn', 
            $or: [
                { isSpectator: false }, 
                { isSpectator: { $exists: false } }
            ] }, 
            {}, {username: 1}, true),
        aiessService.getAllActivity(minDate, maxDate)
    ]);

    let info = [];
    users.forEach(user => {
        let uniqueNominations = [];
        let nominationResets = 0;
        let beatmapReports = 0;
        for (let i = 0; i < allEvents.length; i++) {
            const eventType = allEvents[i]._id;
            const events = allEvents[i].events;
    
            if (eventType == 'Bubbled' || eventType == 'Qualified') {
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];
                    if(event.userId == user.osuId){
                        if (uniqueNominations.length == 0) {
                            uniqueNominations.push(events);
                        } else if (!uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
                            uniqueNominations.push(event);
                        }
                    }
                }
            } else if (eventType == 'Popped' || eventType == 'Disqualified') {
                for (let j = 0; j < events.length; j++) {
                    if(events[j].userId == user.osuId){
                        nominationResets++;
                    }
                }
            } else if (eventType == 'Reported'){
                for (let j = 0; j < events.length; j++) {
                    if(events[j].userId == user.osuId){
                        beatmapReports++;
                    }
                }
            }
        }
        info.push(new obj(user.username, user.osuId, user.modes, uniqueNominations.length, nominationResets, beatmapReports));
    });

    res.json(info);
});

/* GET potential NAT info */
router.get('/findPotentialNatInfo/', async (req, res, next) => {
    class obj 
    {
        constructor(username, osuId, modes, evaluatedApps) 
        {
            this.username = username;
            this.osuId = osuId;
            this.modes = modes;
            this.evaluatedApps = evaluatedApps;
        }
    }

    const appPopulate = [
        { populate: 'applicant', display: 'username osuId' },
        { populate: 'bnEvaluators', display: 'username osuId' },
        { populate: 'test', display: 'totalScore' },
        {
            populate: 'evaluations',
            display: 'evaluator behaviorComment moddingComment vote',
        },
        {
            innerPopulate: 'evaluations',
            populate: { path: 'evaluator', select: 'username osuId group' },
        },
    ];

    const [users, applications] = await Promise.all([
        usersService.query({ 
            group: 'bn', 
            $or: [
                { isSpectator: false }, 
                { isSpectator: { $exists: false } }
            ],
            isBnEvaluator: true }, 
            {}, {username: 1}, true),
        bnAppsService.query({ bnEvaluators: { $exists: true, $not: {$size: 0} }, active: false }, appPopulate, {}, true)
    ]);

    let info = [];
    users.forEach(user => {
        let evaluatedApps = [];
        applications.forEach(app => {
            app.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.id == user.id){
                    evaluatedApps.push(app);
                }
            });
        });
        info.push(new obj(user.username, user.osuId, user.modes, evaluatedApps));
    });

    res.json(info);
});

module.exports = router;
