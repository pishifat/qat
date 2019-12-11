const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const logsService = require('../models/log').service;
const evalsService = require('../models/evaluation').service;
const reportsService = require('../models/report').service;
const evalRoundsService = require('../models/evalRound').service;
const bnAppsService = require('../models/bnApp').service;
const usersService = require('../models/user').service;
const aiessService = require('../models/aiess').service;
const notesService = require('../models/note').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('evaluations/bneval', {
        title: 'Current BN Evaluations',
        script: '../javascripts/bnEval.js',
        isEval: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { populate: 'bn', display: 'username osuId probation' },
    {
        populate: 'evaluations',
        display: 'evaluator behaviorComment moddingComment vote',
    },
    {
        innerPopulate: 'evaluations',
        populate: { path: 'evaluator', select: 'username osuId group isLeader' },
    },
];

const notesPopulate = [
    { populate: 'author', display: 'username' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let er = await evalRoundsService.query({ active: true, deadline: { $lte: minDate } }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
    res.json({ er, evaluator: res.locals.userRequest });
});

function isValidMode(modeToCheck, isOsu, isTaiko, isCatch, isMania) {
    return ((modeToCheck == 'osu' && isOsu) ||
        (modeToCheck == 'taiko' && isTaiko) ||
        (modeToCheck == 'catch' && isCatch) ||
        (modeToCheck == 'mania' && isMania));
}

/* POST submit or edit eval */
router.post('/addEvalRounds/', api.isLeader, async (req, res) => {
    let allUsersByMode = await usersService.getAllByMode(req.body.bn, req.body.probation, req.body.nat);
    let allEvalsToCreate = [];
    let failed = [];
    const deadline = req.body.deadline;
    
    if (allUsersByMode) {
        allUsersByMode = allUsersByMode.filter(m => {
            return isValidMode(m._id, req.body.osu, req.body.taiko, req.body.catch, req.body.mania);
        });
        
        if (req.body.excludeUsers) {
            const excludeUsers = req.body.excludeUsers.split(',');
            for (let i = 0; i < excludeUsers.length; i++) {
                if(parseInt(excludeUsers[i])){
                    excludeUsers[i] = parseInt(excludeUsers[i]);
                }else{
                    excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
                }
            }
            allUsersByMode.forEach(m => {
                m.users = m.users.filter(u => {
                    return !excludeUsers.includes(u.username.toLowerCase()) && !excludeUsers.includes(u.osuId);
                });
            });
        }

        allUsersByMode.forEach(m => {
            m.users.forEach(u => {
                allEvalsToCreate.push({ bn: u.id, mode: m._id, deadline });
            });
        });
    }

    if (req.body.includeUsers) {
        const includeUsers = req.body.includeUsers.split(',');
        for (let i = 0; i < includeUsers.length; i++) {
            let userToSearch = includeUsers[i].trim();
            let u;
            if (!isNaN(userToSearch)) {
                userToSearch = parseInt(userToSearch);
                u = await usersService.query({
                    osuId: userToSearch,
                });
            } else {
                u = await usersService.query({
                    username: new RegExp('^' + helper.escapeUsername(includeUsers[i].trim()) + '$', 'i'),
                });
            }
            if (u && !u.error) {
                if (u.modes) {
                    u.modes.forEach(m => {
                        if (isValidMode(m, req.body.osu, req.body.taiko, req.body.catch, req.body.mania)) {
                            allEvalsToCreate.push({ bn: u._id, mode: m, deadline });
                        }
                    });
                }
                if (u.probation) {
                    u.probation.forEach(m => {
                        if (isValidMode(m, req.body.osu, req.body.taiko, req.body.catch, req.body.mania)) {
                            allEvalsToCreate.push({ bn: u._id, mode: m, deadline });
                        }
                    });
                }
            } else {
                failed.push(includeUsers[i].trim());
            }
        }
    }
    
    if (allEvalsToCreate.length) {
        const result = await evalRoundsService.createMany(allEvalsToCreate);
        if (result.error) return res.json(result);

        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);
        let ers = await evalRoundsService.query({ active: true, deadline: { $lte: minDate } }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
        res.json({ ers, failed });
        logsService.create(
            req.session.mongoId,
            `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`
        );
    } else {
        return res.json({ errors: 'Nothing changed...' });
    }
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
        await evalRoundsService.update(req.params.id, { $push: { evaluations: ev._id } });
        let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
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
                        name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                        value: `submitted current BN eval for **${er.bn.username}**`,
                    },
                ],
            }], 
            er.mode
        );
        if(!er.discussion && ((er.mode == 'osu' && er.evaluations.length > 2) || (er.mode != 'osu' && er.evaluations.length > 1))){
            await evalRoundsService.update(req.params.id, { discussion: true });
            let pass = 0;
            let extend = 0;
            let fail = 0;
            er.evaluations.forEach(evaluation => {
                if(evaluation.vote == 1) pass++;
                else if(evaluation.vote == 2) extend++;
                else if(evaluation.vote == 3) fail++;
            });
            api.webhookPost(
                [{
                    author: {
                        name: `${er.bn.username}`,
                        url: `https://osu.ppy.sh/users/${er.bn.osuId}`,
                    },
                    thumbnail: {
                        url: `https://a.ppy.sh/${er.bn.osuId}`,
                    },
                    color: '3773329',
                    fields:[
                        {
                            name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                            value: 'Current BN eval moved to group discussion',
                        },
                        {
                            name: 'Votes',
                            value: `Pass: **${pass}**, Extend: **${extend}**, Fail: **${fail}**`,
                        },
                    ],
                }], 
                er.mode
            );
        }
    }
    let ev_ = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(ev_);
    logsService.create(
        req.session.mongoId,
        `${req.body.evaluationId ? 'Updated' : 'Submitted'} ${ev_.mode} BN evaluation for "${ev_.bn.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', api.isLeader, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        await evalRoundsService.update(req.body.checkedRounds[i], { discussion: true });
        let er = await evalRoundsService.query({ _id: req.body.checkedRounds[i] }, defaultPopulate);
        let pass = 0;
        let extend = 0;
        let fail = 0;
        er.evaluations.forEach(evaluation => {
            if(evaluation.vote == 1) pass++;
            else if(evaluation.vote == 2) extend++;
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
                        name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                        value: `Moved **${er.bn.username}**'s current BN eval to group discussion`,
                    },
                    {
                        name: 'Votes',
                        value: `Pass: **${pass}**, Extend: **${extend}**, Fail: **${fail}**`,
                    },
                ],
            }], 
            er.mode
        );
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate } }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', api.isLeader, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        await evalRoundsService.update(req.body.checkedRounds[i], { discussion: false });
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate } }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', api.isLeader, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        let er = await evalRoundsService.query({ _id: req.body.checkedRounds[i] });
        let u = await usersService.query({ _id: er.bn });

        if (er.consensus == 'fail') {
            u = await usersService.update(u.id, { $pull: { modes: er.mode } });
            await usersService.update(u.id, { $pull: { probation: er.mode } });
            if (!u.modes.length) {
                await usersService.update(u.id, { group: 'user' });
                await usersService.update(u.id, { $push: { bnDuration: new Date() } });
            }
        }

        if (er.consensus == 'extend') {
            if(u.probation.indexOf(er.mode) < 0){
                await usersService.update(u.id, { $push: { probation: er.mode } });
            }
            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await evalRoundsService.create(er.bn, er.mode, deadline);
        }

        if (er.consensus == 'pass') {
            await usersService.update(u.id, { $pull: { probation: er.mode } });
            if(er.isLowActivity){
                let deadline = new Date();
                deadline.setDate(deadline.getDate() + 40);
                await evalRoundsService.create(er.bn, er.mode, deadline);
            }
        }
        
        await evalRoundsService.update(req.body.checkedRounds[i], { active: false });
        if(er.consensus){
            logsService.create(
                req.session.mongoId,
                `Set ${u.username}'s ${er.mode} BN eval as "${er.consensus}"`
            );
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
                            name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                            value: `**${u.username}**'s current BN eval archived`,
                        },
                        {
                            name: 'Consensus',
                            value: `${er.consensus == 'pass' ? 'Pass' : er.consensus == 'extend' ? 'Extend' : 'Fail'}`,
                        },
                    ],
                }], 
                er.mode
            );
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate } }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', api.isNotSpectator, async (req, res) => {
    let er = await evalRoundsService.update(req.params.id, { 
        consensus: req.body.consensus, 
        isLowActivity: req.body.isLowActivity ? true : false });
    if(req.body.consensus == 'fail'){
        let date = new Date(er.updatedAt);
        date.setDate(date.getDate() + 90);
        await evalRoundsService.update(req.params.id, { cooldownDate: date });
    }
    
    er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    if(req.body.consensus){
        logsService.create(
            req.session.mongoId,`Set consensus of ${er.bn.username}'s ${er.mode} BN eval as ${req.body.consensus}`
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
                        name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                        value: `**${er.bn.username}**'s current BN eval set to **${req.body.consensus}**${req.body.isLowActivity ? ' + low activity warning' : ''}`,
                    },
                ],
            }], 
            er.mode
        );
    }
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', api.isNotSpectator, async (req, res) => {
    await evalRoundsService.update(req.params.id, { cooldownDate: req.body.cooldownDate });
    let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    logsService.create(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${er.bn.username}'s ${er.mode} current BN evaluation`
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
                    name: `http://bn.mappersguild.com/appeval?eval=${er.id}`,
                    value: `**${er.bn.username}**'s re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}**`,
                },
            ],
        }], 
        er.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', api.isNotSpectator, async (req, res) => {
    await evalRoundsService.update(req.params.id, { feedback: req.body.feedback });
    let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    if(!req.body.hasFeedback){
        logsService.create(
            req.session.mongoId,
            `Created feedback for ${er.bn.username}'s ${er.mode} BN evaluation`
        );
        evalRoundsService.update(req.params.id, { feedbackAuthor: req.session.mongoId });
    }else{
        logsService.create(
            req.session.mongoId,
            `Edited feedback of ${er.bn.username}'s ${er.mode} BN evaluation`
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
                    name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                    value: `**${er.bn.username}'s feedback**: ${req.body.feedback.length > 975 ? req.body.feedback.slice(0,975) + '... *(truncated)*' : req.body.feedback}`,
                },
            ],
        }], 
        er.mode
    );
});

/* GET find previous evaluations */
router.get('/findPreviousEvaluations/:id', async (req, res) => {
    let evals;
    evals = await evalRoundsService.query({ bn: req.params.id, active: false, consensus: { $exists: true }, feedback: { $exists: true } }, {}, {}, true);
    if(!evals.length){
        evals = await bnAppsService.query({ applicant: req.params.id, active: false, consensus: { $exists: true }, feedback: { $exists: true } }, {}, {}, true);
    }
    res.json({ previousEvaluations: evals });
});

/* GET find user notes */
router.get('/findUserNotes/:id', async (req, res) => {
    let notes = await notesService.query({ user: req.params.id, isHidden: { $ne: true } }, notesPopulate, {}, true);
    res.json({ userNotes: notes });
});

/* GET find user reports */
router.get('/findUserReports/:id', async (req, res) => {
    let reports = await reportsService.query({ culprit: req.params.id, isActive: { $ne: true } }, {}, {}, true);
    res.json({ userReports: reports });
});

/* GET aiess info */
router.get('/userActivity/:id/:mode/:deadline', async (req, res) => {
    if (isNaN(req.params.id)) {
        return res.json({ error: 'Something went wrong!' });
    }

    let minDate = new Date(req.params.deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(req.params.deadline);
    const [allUserEvents, allEvents] = await Promise.all([
        aiessService.getByEventTypeAndUser(parseInt(req.params.id), minDate, maxDate, req.params.mode),
        aiessService.getAllByEventType(minDate, maxDate, req.params.mode),
    ]);

    if (allUserEvents.error || allEvents.error) return res.json({ error: 'Something went wrong!' });
    
    let nominations = [];
    let uniqueNominations = [];
    let dqs = [];
    let pops = [];

    allUserEvents.forEach(userEvent => {
        const eventType = userEvent._id;
        const events = userEvent.events;

        if (eventType == 'Qualified' || eventType == 'Bubbled') {
            events.forEach(event => {
                nominations.push(event);
            });
        } else if (eventType == 'Disqualified') {
            dqs = events;
        } else if (eventType == 'Popped') {
            pops = events;
        }
    });

    nominations.sort(function(a, b){
        let keyA = new Date(a.timestamp);
        let keyB = new Date(b.timestamp);
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });

    nominations.forEach(event => {
        if (uniqueNominations.length == 0) {
            uniqueNominations.push(event);
        } else if (!uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
            uniqueNominations.push(event);
        }
    });

    let nomsDqd = [];
    let nomsPopped = [];

    for (let i = 0; i < allEvents.length; i++) {
        const eventType = allEvents[i]._id;
        const events = allEvents[i].events;
        
        //this part is slow but necessary for accurate dq responsibility
        if (eventType == 'Disqualified') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await aiessService.query({ beatmapsetId: event.beatmapsetId, timestamp: { $lte: event.timestamp }, eventType: { $ne: 'Reported' } }, {}, { timestamp: -1 }, true, 3);
                    if(a[1].userId == parseInt(req.params.id) || a[2].userId == parseInt(req.params.id)){
                        nomsDqd.push(event);
                    }
                }
            }
        } else if (eventType == 'Popped') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await aiessService.query({ beatmapsetId: event.beatmapsetId, timestamp: { $lte: event.timestamp }, eventType: { $ne: 'Reported' } }, {}, { timestamp: -1 }, true, 2);
                    if(a[1].userId == parseInt(req.params.id)){
                        nomsPopped.push(event);
                    }
                }
            }
        }
    }

    res.json({ noms: uniqueNominations, nomsDqd, nomsPopped, dqs, pops });
});

module.exports = router;
