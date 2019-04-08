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
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
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
    const [er, r] = await Promise.all([
        await evalRoundsService.query({ active: true }, defaultPopulate, { createdAt: 1 }, true),
        await reportsService.query(
            { valid: { $exists: true, $ne: 3 }, feedback: { $exists: true, $nin: '' } },
            {},
            {},
            true
        ),
    ]);
    res.json({ er: er, r: r, evaluator: req.session.mongoId });
});

async function cycleModes(userId, modes, deadline, osu, taiko, ctb, mania) {
    for (let i = 0; i < modes.length; i++) {
        if ((modes[i] == 'osu' && osu) ||
            (modes[i] == 'taiko' && taiko) ||
            (modes[i] == 'catch' && ctb) ||
            (modes[i] == 'mania' && mania)) {
            let er = await evalRoundsService.query({
                bn: userId, mode: modes[i], active: true,
            });
            if (!er) await evalRoundsService.create(userId, modes[i], deadline);
        }
    }
}

/* POST submit or edit eval */
router.post('/addEvalRounds/', async (req, res) => {
    let fullBns = [];
    let probationBns = [];
    let nat = [];

    if (req.body.probation) {
        probationBns = await usersService.query(
            {
                $and: [
                    { group: 'bn' },
                    {
                        $or: [
                            { probation: { $elemMatch: { $eq: req.body.osu && 'osu' } } },
                            { probation: { $elemMatch: { $eq: req.body.taiko && 'taiko' } } },
                            { probation: { $elemMatch: { $eq: req.body.catch && 'catch' } } },
                            { probation: { $elemMatch: { $eq: req.body.mania && 'mania' } } },
                        ],
                    },
                    {
                        modes: {
                            $in: [
                                req.body.osu && 'osu',
                                req.body.taiko && 'taiko',
                                req.body.catch && 'catch',
                                req.body.mania && 'mania',
                            ],
                        },
                    },
                ],
            },
            {},
            {},
            true
        );
    }
    if (req.body.bn) {
        fullBns = await usersService.query(
            {
                $and: [
                    { group: 'bn' },
                    {
                        probation: {
                            $nin: [
                                req.body.osu && 'osu',
                                req.body.taiko && 'taiko',
                                req.body.catch && 'catch',
                                req.body.mania && 'mania',
                            ],
                        },
                    },
                    {
                        modes: {
                            $in: [
                                req.body.osu && 'osu',
                                req.body.taiko && 'taiko',
                                req.body.catch && 'catch',
                                req.body.mania && 'mania',
                            ],
                        },
                    },
                ],
            },
            {},
            {},
            true
        );
    }

    if (req.body.nat) {
        nat = await usersService.query(
            {
                $and: [
                    { group: 'nat' },
                    {
                        modes: {
                            $in: [
                                req.body.osu && 'osu',
                                req.body.taiko && 'taiko',
                                req.body.catch && 'catch',
                                req.body.mania && 'mania',
                            ],
                        },
                    },
                ],
            },
            {},
            {},
            true
        );
    }
    let allUsers = probationBns.concat(fullBns.concat(nat));

    let failed = [];
    if (req.body.excludeUsers) {
        let excludeUsers = req.body.excludeUsers.split(',');
        for (let i = 0; i < excludeUsers.length; i++) {
            let u = await usersService.query({
                username: new RegExp('^' + helper.escapeUsername(excludeUsers[i].trim()) + '$', 'i'),
            });

            if (u) {
                allUsers.forEach(function(user, index) {
                    if (user.id == u.id) {
                        allUsers.splice(index, 1);
                    }
                });
            } else {
                failed.push(excludeUsers[i].trim());
            }
        }
    }

    if (req.body.includeUsers) {
        let includeUsers = req.body.includeUsers.split(',');
        for (let i = 0; i < includeUsers.length; i++) {
            let u = await usersService.query({
                username: new RegExp('^' + helper.escapeUsername(includeUsers[i].trim()) + '$', 'i'),
            });
            if (u) {
                await cycleModes(
                    u.id,
                    u.modes,
                    req.body.deadline,
                    req.body.osu,
                    req.body.taiko,
                    req.body.catch,
                    req.body.mania
                );
            } else {
                failed.push(includeUsers[i].trim());
            }
        }
    }

    if (allUsers.length) {
        for (let i = 0; i < allUsers.length; i++) {
            await cycleModes(
                allUsers[i].id,
                allUsers[i].modes,
                req.body.deadline,
                req.body.osu,
                req.body.taiko,
                req.body.catch,
                req.body.mania
            );
        }
    }
    let ers = await evalRoundsService.query({ active: true }, defaultPopulate, { createdAt: 1 }, true);
    res.json({ ers: ers, failed: failed });
    logsService.create(
        req.session.mongoId,
        `Added BN evaluations for ${allUsers.length} user${allUsers.length == 1 ? '' : 's'}`
    );
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
router.post('/setGroupEval/', async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        await evalRoundsService.update(req.body.checkedRounds[i], { discussion: true });
    }

    let ev = await evalRoundsService.query({ active: true }, defaultPopulate, { createdAt: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        await evalRoundsService.update(req.body.checkedRounds[i], { discussion: false });
    }

    let ev = await evalRoundsService.query({ active: true }, defaultPopulate, { createdAt: 1 }, true);
    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', async (req, res) => {
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

        if (er.consensus == 'extend' && u.probation.indexOf(er.mode) < 0) {
            await usersService.update(u.id, { $push: { probation: er.mode } });
        }

        if (er.consensus == 'pass') {
            await usersService.update(u.id, { $pull: { probation: er.mode } });
        }
        
        await evalRoundsService.update(req.body.checkedRounds[i], { active: false });
        logsService.create(
            req.session.mongoId,
            `Set ${u.username}'s ${er.mode} BN eval as "${er.consensus}"`
        );
    }

    let ev = await evalRoundsService.query({ active: true }, defaultPopulate, { createdAt: 1 }, true);
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
    logsService.create(
        req.session.mongoId,`Set consensus of ${ev.bn.username}'s ${ev.mode} BN eval as ${req.body.consensus}`
    );
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

/* GET aiess info */
router.get('/userActivity/:id/:mode', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 90);

    let noms = await aiessService.query(
        {
            userId: req.params.id,
            timestamp: { $gte: date },
            $or: [{ eventType: 'Bubbled' }, { eventType: 'Qualified' }],
            modes: { $elemMatch: { $eq: req.params.mode }}
        },
        {},
        { beatmapsetId: 1 },
        true
    );
 
    for (let i = 1; i < noms.length; i++) {
        if (noms[i].beatmapsetId == noms[i - 1].beatmapsetId) {
            noms.splice(i-1, 1); //show only unique nominations
            i--;
        }
    }

    let nomsDqd = [];
    let allDqs = await aiessService.query(
        { eventType: 'Disqualified', timestamp: { $gte: date } },
        {},
        { timestamp: 1 },
        true
    );
    allDqs.forEach(dq => {
        noms.forEach(nom => {
            if (nom.beatmapsetId == dq.beatmapsetId && nom.timestamp < dq.timestamp) {
                nomsDqd.push(dq);
            }
        });
    });

    let nomsPopped = [];
    let allPops = await aiessService.query(
        { eventType: 'Popped', timestamp: { $gte: date } },
        {},
        { timestamp: 1 },
        true
    );
    allPops.forEach(pop => {
        noms.forEach(nom => {
            if (nom.beatmapsetId == pop.beatmapsetId) {
                nomsPopped.push(pop);
            }
        });
    });

    let dqs =
        (await aiessService.query(
            { userId: req.params.id, eventType: 'Disqualified', timestamp: { $gte: date } },
            {},
            { timestamp: 1 },
            true
        )) || [];
    let pops =
        (await aiessService.query(
            { userId: req.params.id, eventType: 'Popped', timestamp: { $gte: date } },
            {},
            { timestamp: 1 },
            true
        )) || [];

    res.json({ noms: noms, nomsDqd: nomsDqd, nomsPopped: nomsPopped, dqs: dqs, pops: pops });
});

module.exports = router;
