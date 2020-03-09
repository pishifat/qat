const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const logsService = require('../models/log').service;
const Evaluation = require('../models/evaluation');
const Report = require('../models/report');
const EvalRound = require('../models/evalRound');
const BnApp = require('../models/bnApp');
const User = require('../models/user');
const Aiess = require('../models/aiess');
const Note = require('../models/note');

const router = express.Router();

router.use(api.isLoggedIn);

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
    {
        path: 'bn',
        select: 'username osuId probation modes',
    },
    {
        path: 'natEvaluators',
        select: 'username osuId',
    },
    {
        path: 'evaluations',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group isLeader',
        },
    },
];

const notesPopulate = [
    { path: 'author', select: 'username' },
];

const applicationPopulate = [
    {
        path: 'applicant',
        select: 'username osuId',
    },
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
    let er = await EvalRound.findActiveEvaluations();

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
    let allUsersByMode = await User.getAllByMode(req.body.bn, req.body.probation, req.body.nat);
    let allEvalsToCreate = [];
    let failed = [];
    const deadline = new Date(req.body.deadline);

    if (allUsersByMode) {
        allUsersByMode = allUsersByMode.filter(m => {
            return isValidMode(m._id, req.body.osu, req.body.taiko, req.body.catch, req.body.mania);
        });

        if (req.body.excludeUsers) {
            const excludeUsers = req.body.excludeUsers.split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                if (parseInt(excludeUsers[i])) {
                    excludeUsers[i] = parseInt(excludeUsers[i]);
                } else {
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
                u = await User.findOne({
                    osuId: userToSearch,
                });
            } else {
                u = await User.findByUsername(includeUsers[i].trim());
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

    for (let i = 0; i < allEvalsToCreate.length; i++) {
        const round = allEvalsToCreate[i];
        await EvalRound.deleteManyByUserId(round.bn);
    }

    if (allEvalsToCreate.length) {
        const result = await EvalRound.insertMany(allEvalsToCreate);

        if (result.error) return res.json(result);

        let ers = await EvalRound.findActiveEvaluations();

        res.json({ ers, failed });

        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        if (deadline < minDate) {
            for (let i = 0; i < result.length; i++) {
                const er = result[i];
                const u = await User.findById(er.bn);
                const invalids = [8129817, 3178418, u.osuId];
                const assignedNat = await User.aggregate([
                    { $match: { group: 'nat', isSpectator: { $ne: true }, modes: er.mode, osuId: { $nin: invalids } } },
                    { $sample: { size: er.mode == 'osu' || er.mode == 'catch' ? 3 : 2 } },
                ]);
                let natList = '';

                for (let i = 0; i < assignedNat.length; i++) {
                    let user = assignedNat[i];
                    await EvalRound.findByIdAndUpdate(er.id, { $push: { natEvaluators: user._id } });
                    natList += user.username;

                    if (i + 1 < assignedNat.length) {
                        natList += ', ';
                    }
                }

                await api.webhookPost(
                    [{
                        author: {
                            name: `${req.session.username}`,
                            icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                            url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                        },
                        color: '16756444',
                        fields: [
                            {
                                name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                                value: `Created current BN eval for **${u.username}**`,
                            },
                            {
                                name: 'Assigned NAT',
                                value: natList,
                            },
                        ],
                    }],
                    er.mode
                );
                await helper.sleep(500);
            }
        }



        logsService.create(
            req.session.mongoId,
            `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`
        );
    } else {
        return res.json({ error: 'Nothing changed...' });
    }
});

/* POST submit or edit eval */
router.post('/submitEval/:id', api.isBnOrNat, async (req, res) => {
    if (req.body.evaluationId) {
        await Evaluation.findByIdAndUpdate(req.body.evaluationId, {
            behaviorComment: req.body.behaviorComment,
            moddingComment: req.body.moddingComment,
            vote: req.body.vote,
        });
    } else {
        let ev = await Evaluation.create({
            evaluator: req.session.mongoId,
            behaviorComment: req.body.behaviorComment,
            moddingComment: req.body.moddingComment,
            vote: req.body.vote,
        });

        let er =await EvalRound
            .findByIdAndUpdate(req.params.id, { $push: { evaluations: ev._id } })
            .populate(defaultPopulate);

        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '3800465',
                fields: [
                    {
                        name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                        value: `Submitted current BN eval for **${er.bn.username}**`,
                    },
                ],
            }],
            er.mode
        );
        let twoEvaluationModes = ['taiko', 'mania'];
        let threeEvaluationModes = ['osu', 'catch'];

        if (!er.discussion && ((threeEvaluationModes.includes(er.mode) && er.evaluations.length > 2) || (twoEvaluationModes.includes(er.mode) && er.evaluations.length > 1))) {
            await EvalRound.findByIdAndUpdate(req.params.id, { discussion: true });
            let pass = 0;
            let extend = 0;
            let fail = 0;
            er.evaluations.forEach(evaluation => {
                if (evaluation.vote == 1) pass++;
                else if (evaluation.vote == 2) extend++;
                else if (evaluation.vote == 3) fail++;
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
                    fields: [
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

    let ev_ = await EvalRound.findById(req.params.id).populate(defaultPopulate);

    res.json(ev_);
    logsService.create(
        req.session.mongoId,
        `${req.body.evaluationId ? 'Updated' : 'Submitted'} ${ev_.mode} BN evaluation for "${ev_.bn.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        let er = await EvalRound
            .findByIdAndUpdate(req.body.checkedRounds[i], { discussion: true })
            .populate(defaultPopulate);

        let pass = 0;
        let extend = 0;
        let fail = 0;
        er.evaluations.forEach(evaluation => {
            if (evaluation.vote == 1) pass++;
            else if (evaluation.vote == 2) extend++;
            else if (evaluation.vote == 3) fail++;
        });
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '3773329',
                fields: [
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

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', api.isNat, async (req, res) => {
    await EvalRound.updateMany({
        _id: { $in: req.body.checkedRounds },
    }, {
        discussion: false,
    });

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', api.isNat, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        let er = await EvalRound.findById(req.body.checkedRounds[i]);
        let u = await User.findById(er.bn);

        if (er.consensus == 'fail') {
            u = await User.findByIdAndUpdate(u.id, { $pull: { modes: er.mode } });
            await User.findByIdAndUpdate(u.id, { $pull: { probation: er.mode } });

            if (!u.modes.length) {
                await User.findByIdAndUpdate(u.id, { group: 'user' });
                await User.findByIdAndUpdate(u.id, { $push: { bnDuration: new Date() } });
            }
        }

        if (er.consensus == 'extend') {
            if (u.probation.indexOf(er.mode) < 0) {
                await User.findByIdAndUpdate(u.id, { $push: { probation: er.mode } });
            }

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await EvalRound.create({
                bn: er.bn,
                mode: er.mode,
                deadline,
            });
        }

        if (er.consensus == 'pass') {
            await User.findByIdAndUpdate(u.id, { $pull: { probation: er.mode } });
            let deadline = new Date();

            if (er.isLowActivity) {
                deadline.setDate(deadline.getDate() + 40);
            } else {
                deadline.setDate(deadline.getDate() + 100);
            }

            await EvalRound.create({
                bn: er.bn,
                mode: er.mode,
                deadline,
            });
        }

        await EvalRound.findByIdAndUpdate(req.body.checkedRounds[i], { active: false });

        if (er.consensus) {
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
                    fields: [
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

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    logsService.create(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', api.isNat, async (req, res) => {
    let er = await EvalRound.findByIdAndUpdate(req.params.id, {
        consensus: req.body.consensus,
        isLowActivity: req.body.isLowActivity ? true : false,
    });

    if (req.body.consensus == 'fail') {
        let date = new Date(er.updatedAt);
        date.setDate(date.getDate() + 90);
        await EvalRound.findByIdAndUpdate(req.params.id, { cooldownDate: date });
    }

    er = await EvalRound.findById(req.params.id).populate(defaultPopulate);

    res.json(er);

    if (req.body.consensus) {
        logsService.create(
            req.session.mongoId,`Set consensus of ${er.bn.username}'s ${er.mode} BN eval as ${req.body.consensus == 'extend' ? 'probation' : req.body.consensus}`
        );
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '13272813',
                fields: [
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
router.post('/setCooldownDate/:id', api.isNat, async (req, res) => {
    let er = await EvalRound
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

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
            fields: [
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
router.post('/setFeedback/:id', api.isNat, async (req, res) => {
    let er = await EvalRound
        .findByIdAndUpdate(req.params.id, { feedback: req.body.feedback })
        .populate(defaultPopulate);

    res.json(er);

    if (!req.body.hasFeedback) {
        logsService.create(
            req.session.mongoId,
            `Created feedback for ${er.bn.username}'s ${er.mode} BN evaluation`
        );
        EvalRound.findByIdAndUpdate(req.params.id, { feedbackAuthor: req.session.mongoId });
    } else {
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
            fields: [
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
router.get('/findPreviousEvaluations/:id', api.isNat, async (req, res) => {
    let evals;
    evals = await EvalRound.find({
        bn: req.params.id,
        active: false,
        consensus: { $exists: true },
        feedback: { $exists: true },
    });

    if (!evals.length) {
        evals = await BnApp.find({
            applicant: req.params.id,
            active: false,
            consensus: { $exists: true },
            feedback: { $exists: true },
        });
    }

    res.json({ previousEvaluations: evals });
});

/* GET find user notes */
router.get('/findUserNotes/:id', api.isNat, async (req, res) => {
    const userNotes = await Note
        .find({
            user: req.params.id,
            isHidden: { $ne: true },
        })
        .populate(notesPopulate);

    res.json({ userNotes });
});

/* GET find user reports */
router.get('/findUserReports/:id', api.isNat, async (req, res) => {
    const userReports = await Report.find({
        culprit: req.params.id,
        isActive: { $ne: true },
    });

    res.json({ userReports });
});

/* GET aiess info */
router.get('/userActivity/:id/:mode/:deadline/:mongoId', async (req, res) => {
    if (isNaN(req.params.id)) {
        return res.json({ error: 'Something went wrong!' });
    }

    let deadline = parseInt(req.params.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(deadline);
    const [user, allUserEvents, allEvents, qualityAssuranceChecks, assignedApplications] = await Promise.all([
        User.findById(req.params.mongoId),
        Aiess.getByEventTypeAndUser(parseInt(req.params.id), minDate, maxDate, req.params.mode),
        Aiess.getAllByEventType(minDate, maxDate, req.params.mode),
        Aiess.find({
            qualityAssuranceCheckers: req.params.mongoId,
            updatedAt: { $gte: minDate, $lte: maxDate },
        }),
        BnApp
            .find({
                bnEvaluators: req.params.mongoId,
                mode: req.params.mode,
                createdAt: { $gte: minDate },
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),
    ]);

    if (user.error || allUserEvents.error || allEvents.error || qualityAssuranceChecks.error || assignedApplications.error) return res.json({ error: 'Something went wrong!' });

    // sort events done by user by type
    let nominations = [];
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

    // sort nominations by date
    nominations.sort(function(a, b) {
        let keyA = new Date(a.timestamp);
        let keyB = new Date(b.timestamp);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;

        return 0;
    });

    // remove duplicate nominations
    let uniqueNominations = [];

    nominations.forEach(event => {
        if (uniqueNominations.length == 0) {
            uniqueNominations.push(event);
        } else if (!uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
            uniqueNominations.push(event);
        }
    });

    // find user's disqualified/popped nominations
    let nomsDqd = [];
    let nomsPopped = [];

    for (let i = 0; i < allEvents.length; i++) {
        const eventType = allEvents[i]._id;
        const events = allEvents[i].events;

        if (eventType == 'Disqualified') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];

                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(3);

                    if (a[1].userId == parseInt(req.params.id) || a[2].userId == parseInt(req.params.id)) {
                        nomsDqd.push(event);
                    }
                }
            }
        } else if (eventType == 'Popped') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];

                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(2);

                    if (a[1].userId == parseInt(req.params.id)) {
                        nomsPopped.push(event);
                    }
                }
            }
        }
    }

    // if user is NAT or was NAT during evaluation period...
    let natApplications = [];
    let natEvalRounds = [];

    if (user.natDuration.length % 2 || user.natDuration[user.natDuration.length - 1] < minDate) {
        // find all applications & evalRounds
        const [allApplications, allEvalRounds] = await Promise.all([
            BnApp
                .find({
                    createdAt: { $gte: minDate },
                    mode: req.params.mode,
                })
                .populate(applicationPopulate)
                .sort({ createdAt: 1 }),

            EvalRound
                .find({
                    deadline: { $gte: minDate },
                    mode: req.params.mode,
                })
                .populate(defaultPopulate)
                .sort({ createdAt: 1 }),
        ]);

        // extract apps that user evaluated or was assigned to
        allApplications.forEach(application => {
            for (let i = 0; i < application.evaluations.length; i++) {
                const evaluation = application.evaluations[i];

                if (evaluation.evaluator.id == user.id || (application.natEvaluators && application.natEvaluators.includes(user.id))) {
                    natApplications.push(application);
                    break;
                }
            }
        });

        // extract evalRounds that user evaluated or was assigned to
        allEvalRounds.forEach(evalRound => {
            for (let i = 0; i < evalRound.evaluations.length; i++) {
                const evaluation = evalRound.evaluations[i];

                if (evaluation.evaluator.id == user.id || (evalRound.natEvaluators && evalRound.natEvaluators.includes(user.id))) {
                    natEvalRounds.push(evalRound);
                    break;
                }
            }
        });
    }

    res.json({ noms: uniqueNominations, nomsDqd, nomsPopped, dqs, pops, qualityAssuranceChecks, assignedApplications, natApplications, natEvalRounds });
});

module.exports = router;
