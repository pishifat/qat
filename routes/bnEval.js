const express = require('express');
const api = require('../models/api');
const helper = require('./helper');
const logsService = require('../models/log').service;
const evalsService = require('../models/evaluation').service;
const reportsService = require('../models/report').service;
const evalRoundsService = require('../models/evalRound').service;
const usersService = require('../models/user').service;
const aiessService = require('../models/aiess').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('evaluations/bneval', {
        title: 'Current BN Evaluations',
        script: '../javascripts/bnEval.js',
        isEval: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
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
        populate: { path: 'evaluator', select: 'username osuId isLeader' },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    const [er, r] = await Promise.all([
        await evalRoundsService.query({ active: true, deadline: { $lte: minDate }, }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true),
        await reportsService.query(
            { valid: { $exists: true, $ne: 3 }, feedback: { $exists: true, $nin: '' } },
            {},
            {},
            true
        ),
    ]);
    res.json({ er: er, r: r, evaluator: res.locals.userRequest });
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
                allEvalsToCreate.push({ bn: u.id, mode: m._id, deadline: deadline });
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
                    osuId: userToSearch
                });
            } else {
                u = await usersService.query({
                    username: new RegExp('^' + helper.escapeUsername(includeUsers[i].trim()) + '$', 'i')
                });
            }
            if (u && !u.error) {
                if (u.modes) {
                    u.modes.forEach(m => {
                        if (isValidMode(m, req.body.osu, req.body.taiko, req.body.catch, req.body.mania)) {
                            allEvalsToCreate.push({ bn: u._id, mode: m, deadline: deadline });
                        }
                    });
                }
                if (u.probation) {
                    u.probation.forEach(m => {
                        if (isValidMode(m, req.body.osu, req.body.taiko, req.body.catch, req.body.mania)) {
                            allEvalsToCreate.push({ bn: u._id, mode: m, deadline: deadline });
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
        let ers = await evalRoundsService.query({ active: true, deadline: { $lte: minDate }, }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
        res.json({ ers: ers, failed: failed });
        logsService.create(
            req.session.mongoId,
            `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`
        );
    } else {
        return res.json({ errors: 'Nothing changed...' });
    }
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
        await evalRoundsService.update(req.params.id, { $push: { evaluations: ev._id } });
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
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate }, }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
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
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate }, }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
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
                await usersService.update(u.id, { $push: {bnDuration: new Date() }});
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
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    let ev = await evalRoundsService.query({ active: true, deadline: { $lte: minDate }, }, defaultPopulate, { deadline: 1, consensus: 1, feedback: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', async (req, res) => {
    await evalRoundsService.update(req.params.id, { consensus: req.body.consensus });
    let ev = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(ev);
    if(req.body.consensus){
        logsService.create(
            req.session.mongoId,`Set consensus of ${ev.bn.username}'s ${ev.mode} BN eval as ${req.body.consensus}`
        );
    }
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', async (req, res) => {
    await evalRoundsService.update(req.params.id, { feedback: req.body.feedback });
    let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    logsService.create(
        req.session.mongoId,
        `Edited feedback of ${er.bn.username}'s ${er.mode} BN evaluation`
    );
});

/* POST toggle priority */
router.post('/toggleIsPriority/:id', async (req, res) => {
    await evalRoundsService.update(req.params.id, { isPriority: !req.body.isPriority });
    let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    logsService.create(
        req.session.mongoId,
        `Toggled priority for ${er.bn.username}'s ${er.mode} BN evaluation`
    );
});

/* POST toggle low activity */
router.post('/toggleIsLowActivity/:id', async (req, res) => {
    await evalRoundsService.update(req.params.id, { isLowActivity: !req.body.isLowActivity });
    let er = await evalRoundsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(er);
    logsService.create(
        req.session.mongoId,
        `Toggled inactivity for ${er.bn.username}'s ${er.mode} BN evaluation`
    );
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
        aiessService.getAllByEventType(minDate, maxDate, req.params.mode)
    ]);

    if (allUserEvents.error || allEvents.error) return res.json({ error: 'Something went wrong!' });
    
    let uniqueNominations = [];
    let dqs = [];
    let pops = [];

    allUserEvents.forEach(userEvent => {
        const eventType = userEvent._id;
        const events = userEvent.events;

        if (eventType == 'Qualified' || eventType == 'Bubbled') {
            events.forEach(event => {
                if (uniqueNominations.length == 0) {
                    uniqueNominations.push(event);
                } else if (!uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
                    uniqueNominations.push(event);
                }
            });
        } else if (eventType == 'Disqualified') {
            dqs = events;
        } else if (eventType == 'Popped') {
            pops = events;
        }
    });

    uniqueNominations.sort(function(a, b){
        let keyA = new Date(a.timestamp);
        let keyB = new Date(b.timestamp);
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    
    let nomsDqd = [];
    let nomsPopped = [];

    for (let i = 0; i < allEvents.length; i++) {
        const eventType = allEvents[i]._id;
        const events = allEvents[i].events;
        
        if (eventType == 'Disqualified') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    /*if(!event.responsibleNominators || !event.responsibleNominators.length) {
                        let a = await aiessService.query({beatmapsetId: event.beatmapsetId, timestamp: { $lte: event.timestamp }}, {}, {timestamp: -1}, true, 3);
                        await aiessService.update(a[0].id, {$push: {responsibleNominators: {$each: [a[1].userId, a[2].userId]} } } );
                    }*/
                    //these commented sections are for bn score
                    nomsDqd.push(event);
                }
            }
        } else if (eventType == 'Popped') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    /*if(!event.responsibleNominators || !event.responsibleNominators.length){
                        let a = await aiessService.query({beatmapsetId: event.beatmapsetId, timestamp: { $lte: event.timestamp }}, {}, {timestamp: -1}, true, 2);
                        await aiessService.update(a[0].id, {$push: {responsibleNominators: a[1].userId} });
                        if(a[1].userId == parseInt(req.params.id)){
                            nomsPopped.push(event);
                        }
                    }else if(event.responsibleNominators.indexOf(parseInt(req.params.id)) >= 0){
                        nomsPopped.push(event);
                    }*/
                    nomsPopped.push(event);
                }
            }
        }
    }

    res.json({ noms: uniqueNominations, nomsDqd: nomsDqd, nomsPopped: nomsPopped, dqs: dqs, pops: pops });
});

module.exports = router;
