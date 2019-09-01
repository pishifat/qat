const express = require('express');
const api = require('../helpers/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;
const bnAppsService = require('../models/bnApp').service;
const evalRoundsService = require('../models/evalRound').service;
const evalsService = require('../models/evaluation').service;
const aiessService = require('../models/aiess').service;
const notesService = require('../models/note').service;

const router = express.Router();

router.use(api.isLoggedIn);

const defaultNotePopulate = [
    { populate: 'author', display: 'username osuId' },
    { populate: 'user', display: 'username osuId' },
];

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('users', {
        title: 'BN/NAT Listing',
        script: '../javascripts/users.js',
        isUsers: true,
        isBnOrNat: res.locals.userRequest.isBnOrNat,
        isNat: res.locals.userRequest.isNat,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let u = await usersService.query(
        { $or: [{ group: 'nat' }, { group: 'bn' }], isSpectator: { $ne: true }  },
        {},
        { username: 1 },
        true
    );
    res.json({ 
        users: u, 
        userId: req.session.mongoId, 
        isLeader: res.locals.userRequest.isLeader, 
        isNat: res.locals.userRequest.group == 'nat', 
        isBn: res.locals.userRequest.group == 'bn', 
    });
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
    let u = await usersService.update(req.params.id, { group: req.body.group,  probation: [], $push: { bnDuration: new Date(), natDuration: new Date() } });
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Changed usergroup of "${u.username}" to "${req.body.group.toUpperCase()}"`
    );
});

/* POST remove from BN/NAT without evaluation */
router.post('/removeGroup/:id', api.isLeader, async (req, res) => {
    let u = await usersService.query({ _id: req.params.id });
    let logGroup = u.group;
    if(u.group == 'bn'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: { bnDuration: new Date() } });
    }else if(u.group == 'nat'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: { natDuration: new Date() } });
    }
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Removed "${u.username}" from the ${logGroup.toUpperCase()}`
    );
});

/* GET user notes */
router.get('/loadUserNotes/:id', api.isNat, async (req, res) => {
    let notes = await notesService.query(
        { user: req.params.id, isHidden: { $ne: true } },
        defaultNotePopulate,
        { createdAt: -1 },
        true
    );
    res.json(notes);
});

/* POST save note */
router.post('/saveNote/:id', api.isNat, async (req, res) => {
    let note = await notesService.create(
        req.session.mongoId,
        req.params.id,
        req.body.comment
    );
    note = await notesService.query({ _id: note._id }, defaultNotePopulate);
    res.json(note);
    let u = await usersService.query({ _id: req.params.id });
    logsService.create(
        req.session.mongoId,
        `Added user note to "${u.username}"`
    );
    api.webhookPost(
        [{
            author: {
                name: `${note.author.username}`,
                icon_url: `https://a.ppy.sh/${note.author.osuId}`,
                url: `https://osu.ppy.sh/users/${note.author.osuId}`,
            },
            color: '14855903',
            fields:[
                {
                    name: 'http://bn.mappersguild.com/users',
                    value: `Added note to **${note.user.username}**'s profile`,
                },
                {
                    name: 'Note',
                    value: req.body.comment,
                },
            ],
        }], 
        u.modes[0]
    );
});

/* POST save note */
router.post('/hideNote/:id', api.isNat, async (req, res) => {
    await notesService.update(req.params.id, { isHidden: true } );
    res.json({});
    let u = await usersService.query({ _id: req.body.userId });
    logsService.create(
        req.session.mongoId,
        `Removed user note from "${u.username}"`
    );
});

/* GET all users with badge info */
router.get('/findUserBadgeInfo', async (req, res) => {
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
        let num = req.body.add ? 1 : -1;
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

router.get('/findNatActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - req.params.days);
    let minAppDate = new Date();
    minAppDate.setDate(minAppDate.getDate() - (req.params.days - 7));
    let maxAppDate = new Date();
    maxAppDate.setDate(maxAppDate.getDate() - 7);
    const [users, evaluations, writtenFeedbacks, bnApps, bnRounds] = await Promise.all([
        usersService.query({ 
            group: 'nat', 
            modes: req.params.mode,
            isSpectator: { $ne: true } },
        {}, { username: 1 }, true),
        await evalsService.query({ createdAt: { $gte: minDate } }, {}, {}, true),
        await logsService.query({ isFeedbackActivity: true, createdAt: { $gte: minDate }  }, {}, {}, true),
        await bnAppsService.query({ mode: req.params.mode, createdAt: { $gte: minAppDate, $lte: maxAppDate }  }, {}, {}, true),
        await evalRoundsService.query({ mode: req.params.mode, deadline: { $gte: minAppDate, $lte: maxAppDate }  }, {}, {}, true),
    ]);

    class obj 
    {
        constructor(username, osuId, totalEvaluations, totalWrittenFeedbacks, joinDate) 
        {
            this.username = username;
            this.osuId = osuId;
            this.totalEvaluations = totalEvaluations;
            this.totalWrittenFeedbacks = totalWrittenFeedbacks;
            this.joinDate = joinDate;
        }
    }

    let invalids = [8129817, 3178418, 2204515, 2202163];
    let info = [];
    users.forEach(user => {
        if(invalids.indexOf(user.osuId) == -1){
            let evalCount = 0;
            let feedbackCount = 0;
            evaluations.forEach(evaluation => {
                if(evaluation.evaluator.toString() == user.id){
                    evalCount++;
                }     
            });
            writtenFeedbacks.forEach(log => {
                if(log.user == user.id){
                    feedbackCount++;
                }
            });
            info.push(new obj(user.username, user.osuId, evalCount, feedbackCount, user.natDuration[user.natDuration.length - 1]));
        }
    });

    res.json({ info, total: bnApps.length + bnRounds.length });
});

router.get('/findBnActivity/:days/:mode', async (req, res) => {
    class obj 
    {
        constructor(username, osuId, uniqueNominations, nominationResets, beatmapReports, joinDate) 
        {
            this.username = username;
            this.osuId = osuId;
            this.uniqueNominations = uniqueNominations;
            this.nominationResets = nominationResets;
            this.beatmapReports = beatmapReports;
            this.joinDate = joinDate;
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - req.params.days);
    let maxDate = new Date();
    const [users, allEvents] = await Promise.all([
        usersService.query({ 
            group: 'bn', 
            modes: req.params.mode,
            isSpectator: { $ne: true } },
        {}, { username: 1 }, true),
        aiessService.getAllActivity(minDate, maxDate, req.params.mode),
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
        info.push(new obj(user.username, user.osuId, uniqueNominations.length, nominationResets, beatmapReports, user.bnDuration[user.bnDuration.length - 1]));
    });

    res.json(info);
});

/* GET potential NAT info */
router.get('/findPotentialNatInfo/', async (req, res) => {
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
            isSpectator: { $ne: true },
            isBnEvaluator: true }, 
        {}, { username: 1 }, true),
        bnAppsService.query({ bnEvaluators: { $exists: true, $not: { $size: 0 } }, active: false }, appPopulate, {}, true),
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
