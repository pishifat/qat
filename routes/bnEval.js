const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const Logger = require('../models/log');
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
router.get('/', api.isNat, (req, res) => {
    res.render('evaluations/bneval', {
        title: 'Current BN Evaluations',
        script: '../javascripts/bnEval.js',
        loggedInAs: req.session.mongoId,
        isEval: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    {
        path: 'bn',
        select: 'username osuId probation modes group',
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
            select: 'username osuId group',
        },
    },
];

const notesPopulate = [
    { path: 'author', select: 'username osuId' },
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
router.get('/relevantInfo', api.isNat, async (req, res) => {
    const er = await EvalRound.findActiveEvaluations();

    res.json({ er, evaluator: res.locals.userRequest });
});

function isValidMode(modeToCheck, isOsu, isTaiko, isCatch, isMania) {
    return ((modeToCheck == 'osu' && isOsu) ||
        (modeToCheck == 'taiko' && isTaiko) ||
        (modeToCheck == 'catch' && isCatch) ||
        (modeToCheck == 'mania' && isMania));
}

/* POST submit or edit eval */
router.post('/addEvalRounds/', api.isNat, api.isNotSpectator, async (req, res) => {
    const includeFullBns = req.body.groups.includes('fullBn');
    const includeProbationBns = req.body.groups.includes('probationBn');
    const includeNat = req.body.groups.includes('nat');
    const isOsu = req.body.modes.includes('osu');
    const isTaiko = req.body.modes.includes('taiko');
    const isCatch = req.body.modes.includes('catch');
    const isMania = req.body.modes.includes('mania');
    let allEvalsToCreate = [];
    let failed = [];
    const deadline = new Date(req.body.deadline);

    // if user groups are selected
    let allUsersByMode = await User.getAllByMode(includeFullBns, includeProbationBns, includeNat);

    if (allUsersByMode) {
        allUsersByMode = allUsersByMode.filter(m => {
            return isValidMode(m._id, isOsu, isTaiko, isCatch, isMania);
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

    // if usernames are specified
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
                        if (isValidMode(m, isOsu, isTaiko, isCatch, isMania)) {
                            allEvalsToCreate.push({ bn: u._id, mode: m, deadline });
                        }
                    });
                }
            } else {
                failed.push(includeUsers[i].trim());
            }
        }
    }

    if (!allEvalsToCreate.length) {
        return res.json({ error: 'No evaluations generated' });
    }


    // delete scheduled evalRounds
    for (let i = 0; i < allEvalsToCreate.length; i++) {
        const round = allEvalsToCreate[i];
        await EvalRound.deleteManyByUserId(round.bn);
    }

    // create evalRounds
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
                    author: api.defaultWebhookAuthor(req.session),
                    color: api.webhookColors.white,
                    description: `Created [**${u.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id})`,
                    fields: [
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

    Logger.generate(
        req.session.mongoId,
        `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`
    );
});

/* POST submit or edit eval */
router.post('/submitEval/:id', api.isNat, api.isNotSpectator, async (req, res) => {
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
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.lightGreen,
                description: `Submitted eval for [**${er.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id})`,
            }],
            er.mode
        );
        const twoEvaluationModes = ['catch', 'mania'];
        const threeEvaluationModes = ['osu', 'taiko'];

        if (!er.discussion && ((threeEvaluationModes.includes(er.mode) && er.evaluations.length > 2) || (twoEvaluationModes.includes(er.mode) && er.evaluations.length > 1))) {
            await EvalRound.findByIdAndUpdate(req.params.id, { discussion: true });
            let pass = 0;
            let probation = 0;
            let fail = 0;
            er.evaluations.forEach(evaluation => {
                if (evaluation.vote == 1) pass++;
                else if (evaluation.vote == 2) probation++;
                else if (evaluation.vote == 3) fail++;
            });
            api.webhookPost(
                [{
                    thumbnail: {
                        url: `https://a.ppy.sh/${er.bn.osuId}`,
                    },
                    color: api.webhookColors.gray,
                    description: `[**${er.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id}) moved to group discussion`,
                    fields: [
                        {
                            name: 'Votes',
                            value: `Pass: **${pass}**, Probation: **${probation}**, Fail: **${fail}**`,
                        },
                    ],
                }],
                er.mode
            );
        }
    }

    let ev_ = await EvalRound.findById(req.params.id).populate(defaultPopulate);

    res.json(ev_);
    Logger.generate(
        req.session.mongoId,
        `${req.body.evaluationId ? 'Updated' : 'Submitted'} ${ev_.mode} BN evaluation for "${ev_.bn.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', api.isNat, api.isNotSpectator, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        let er = await EvalRound
            .findByIdAndUpdate(req.body.checkedRounds[i], { discussion: true })
            .populate(defaultPopulate);

        let pass = 0;
        let probation = 0;
        let fail = 0;
        er.evaluations.forEach(evaluation => {
            if (evaluation.vote == 1) pass++;
            else if (evaluation.vote == 2) probation++;
            else if (evaluation.vote == 3) fail++;
        });
        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.lightRed,
                description: `Moved [**${er.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id}) to group discussion`,
                fields: [
                    {
                        name: 'Votes',
                        value: `Pass: **${pass}**, Probation: **${probation}**, Fail: **${fail}**`,
                    },
                ],
            }],
            er.mode
        );
    }

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', api.isNat, api.isNotSpectator, async (req, res) => {
    await EvalRound.updateMany({
        _id: { $in: req.body.checkedRounds },
    }, {
        discussion: false,
    });

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', api.isNat, api.isNotSpectator, async (req, res) => {
    for (let i = 0; i < req.body.checkedRounds.length; i++) {
        let er = await EvalRound.findById(req.body.checkedRounds[i]);
        let u = await User.findById(er.bn);

        if (er.consensus == 'fail') {
            u = await User.findByIdAndUpdate(u.id, { $pull: { modes: er.mode } });
            await User.findByIdAndUpdate(u.id, { $pull: { probation: er.mode } });

            if (!u.modes.length) {
                await User.findByIdAndUpdate(u.id, { group: 'user' });

                if (u.group == 'bn') {
                    await User.findByIdAndUpdate(u.id, { $push: { bnDuration: new Date() } });
                } else if (u.group == 'nat') {
                    await User.findByIdAndUpdate(u.id, { $push: { natDuration: new Date() } });
                }
            }
        }

        if (er.consensus == 'probation') {
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

                // process user group changes
                if (er.isMoveToNat || er.isMoveToBn) {
                    await User.findByIdAndUpdate(er.bn, {
                        group: er.isMoveToNat ? 'nat' : 'bn',
                        probation: [],
                        $push: {
                            bnDuration: new Date(),
                            natDuration: new Date(),
                        },
                    });
                }
            }

            await EvalRound.create({
                bn: er.bn,
                mode: er.mode,
                deadline,
            });
        }

        await EvalRound.findByIdAndUpdate(req.body.checkedRounds[i], { active: false, resignedOnGoodTerms: er.resignedOnGoodTerms ? true : false });

        let consensusText;

        if (er.consensus == 'pass') {
            consensusText = 'Pass';

            if (er.isLowActivity) {
                consensusText += ' + Low activity warning';
            } else if (er.isMoveToNat) {
                consensusText += ' + Move to NAT';
            } else if (er.isMoveToBn) {
                consensusText += ' + Move to BN';
            }
        } else if (er.consensus == 'probation') {
            consensusText = 'Probation';
        } else if (er.consensus == 'fail') {
            consensusText = 'Fail';

            if (er.resignedOnGoodTerms) {
                consensusText += ' + Resigned on good terms';
            }
        } else {
            consensusText = 'No consensus set';
        }

        Logger.generate(
            req.session.mongoId,
            `Set ${u.username}'s ${er.mode} BN eval as "${consensusText}"`
        );

        api.webhookPost(
            [{
                author: api.defaultWebhookAuthor(req.session),
                color: api.webhookColors.black,
                description: `Archived [**${u.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id}) with **${consensusText}** consensus`,
            }],
            er.mode
        );
    }

    let ev = await EvalRound.findActiveEvaluations();

    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let er = await EvalRound.findByIdAndUpdate(req.params.id, {
        consensus: req.body.consensus,
        isLowActivity: req.body.isLowActivity ? true : false,
        resignedOnGoodTerms: req.body.resignedOnGoodTerms ? true : false,
        resignedOnStandardTerms: req.body.resignedOnStandardTerms ? true : false,
        isMoveToNat: req.body.isMoveToNat ? true : false,
        isMoveToBn: req.body.isMoveToBn ? true : false,
    });

    if (req.body.consensus == 'fail') {
        let date = new Date(er.updatedAt);
        date.setDate(date.getDate() + 90);
        await EvalRound.findByIdAndUpdate(req.params.id, { cooldownDate: date });
    }

    er = await EvalRound.findById(req.params.id).populate(defaultPopulate);

    res.json(er);

    let consensusText;

    if (er.consensus == 'pass') {
        consensusText = 'Pass';

        if (er.isLowActivity) {
            consensusText += ' + Low activity warning';
        } else if (er.isMoveToNat) {
            consensusText += ' + Move to NAT';
        } else if (er.isMoveToBn) {
            consensusText += ' + Move to BN';
        }
    } else if (er.consensus == 'probation') {
        consensusText = 'Probation';
    } else if (er.consensus == 'fail') {
        consensusText = 'Fail';

        if (er.resignedOnGoodTerms) {
            consensusText += ' + Resigned on good terms';
        } else if (er.resignedOnStandardTerms) {
            consensusText += ' + Resigned on standard terms';
        }
    } else {
        consensusText = 'No consensus set';
    }

    Logger.generate(
        req.session.mongoId,`Set consensus of ${er.bn.username}'s ${er.mode} BN eval as "${consensusText}"`
    );

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.lightBlue,
            description: `[**${er.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id}) set to **${consensusText}**`,
        }],
        er.mode
    );
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let er = await EvalRound
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

    res.json(er);
    Logger.generate(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${er.bn.username}'s ${er.mode} current BN evaluation`
    );
    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.darkBlue,
            description: `**${er.bn.username}**'s re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}**`,
        }],
        er.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let er = await EvalRound
        .findByIdAndUpdate(req.params.id, { feedback: req.body.feedback })
        .populate(defaultPopulate);

    res.json(er);

    if (!req.body.hasFeedback) {
        Logger.generate(
            req.session.mongoId,
            `Created feedback for ${er.bn.username}'s ${er.mode} BN evaluation`
        );
        EvalRound.findByIdAndUpdate(req.params.id, { feedbackAuthor: req.session.mongoId });
    } else {
        Logger.generate(
            req.session.mongoId,
            `Edited feedback of ${er.bn.username}'s ${er.mode} BN evaluation`
        );
    }

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.blue,
            description: `**[${er.bn.username}'s current BN eval](http://bn.mappersguild.com/bneval?eval=${er.id}) feedback**: ${req.body.feedback.length > 925 ? req.body.feedback.slice(0,925) + '... *(truncated)*' : req.body.feedback}`,
        }],
        er.mode
    );
});

/* GET find previous evaluations */
router.get('/findPreviousEvaluations/:id', api.isNat, async (req, res) => {
    const evalRounds = await EvalRound.find({
        bn: req.params.id,
        active: false,
        consensus: { $exists: true },
        feedback: { $exists: true },
    });

    const applications = await BnApp.find({
        applicant: req.params.id,
        active: false,
        consensus: { $exists: true },
        feedback: { $exists: true },
    });

    let previousEvaluations = evalRounds.concat(applications);

    if (evalRounds.length && applications.length) {
        previousEvaluations.sort((a, b) => {
            a.date = (a.deadline ? a.deadline : a.createdAt);
            b.date = (b.deadline ? b.deadline : b.createdAt);
            if (a.date > b.date) return 1;
            if (a.date < b.date) return -1;

            return 0;
        });
    }

    res.json({ previousEvaluations });
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

/* POST replace evaluator */
router.post('/replaceUser/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let evalRound = await EvalRound.findById(req.params.id).populate(defaultPopulate);
    let newEvaluator;

    const invalids = [8129817, 3178418];
    evalRound.natEvaluators.forEach(user => {
        invalids.push(user.osuId);
    });

    if (!invalids.includes(req.session.osuId) && res.locals.userRequest.modes.includes(evalRound.mode)) {
        let currentUser = await User.findById(req.session.mongoId);

        if (currentUser.modes.includes(evalRound.mode)) {
            newEvaluator = currentUser;
        }
    } else {
        const evaluatorArray = await User.aggregate([
            { $match: { group: 'nat', isSpectator: { $ne: true }, modes: evalRound.mode, osuId: { $nin: invalids } } },
            { $sample: { size: 1 } },
        ]);
        newEvaluator = evaluatorArray[0];
    }

    await Promise.all([
        EvalRound.findByIdAndUpdate(req.params.id, {
            $push: { natEvaluators: newEvaluator._id },
        }),
        EvalRound.findByIdAndUpdate(req.params.id, {
            $pull: { natEvaluators: req.body.evaluatorId },
        }),
    ]);

    evalRound = await EvalRound.findById(req.params.id).populate(defaultPopulate);

    res.json(evalRound);

    Logger.generate(
        req.session.mongoId,
        'Re-selected an evaluator on current BN eval'
    );

    const user = await User.findById(req.body.evaluatorId);

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.orange,
            description: `Replaced **${user.username}** with **${newEvaluator.username}** as NAT evaluator for [**${evalRound.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${evalRound.id})`,
        }],
        evalRound.mode
    );
});

/* GET aiess info */
router.get('/userActivity/:id/:modes/:deadline/:mongoId', async (req, res) => {
    if (isNaN(req.params.id)) {
        return res.json({ error: 'Something went wrong!' });
    }

    const userOsuId = parseInt(req.params.id);
    const modes = req.params.modes.split(',');
    let deadline = parseInt(req.params.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(deadline);
    const [user, allUserEvents, allEvents, qualityAssuranceChecks, assignedApplications] = await Promise.all([
        User.findById(req.params.mongoId),
        Aiess.getByEventTypeAndUser(userOsuId, minDate, maxDate, modes),
        Aiess.getAllByEventType(minDate, maxDate, modes),
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
    let disqualifications = [];
    let pops = [];

    allUserEvents.forEach(userEvent => {
        const eventType = userEvent._id;
        const events = userEvent.events;

        if (eventType == 'Qualified' || eventType == 'Bubbled') {
            events.forEach(event => {
                nominations.push(event);
            });
        } else if (eventType == 'Disqualified') {
            disqualifications = events;
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

    // find user's disqualified/popped nominations & disqualified qa checks
    let nominationsDisqualified = [];
    let nominationsPopped = [];
    let disqualifiedQualityAssuranceChecks = [];

    for (let i = 0; i < allEvents.length; i++) {
        const eventType = allEvents[i]._id;
        const events = allEvents[i].events;

        if (eventType == 'Disqualified') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];

                // check if user's nomination was disqualified
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(3);

                    // check if user was the nominator
                    if (a[1].userId == userOsuId || a[2].userId == userOsuId) {
                        nominationsDisqualified.push(event);
                    }
                // check if user's quality assurance check was later disqualified
                } else if (qualityAssuranceChecks.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .findOne({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: 'Qualified',
                        })
                        .populate([{
                            path: 'qualityAssuranceComments',
                            populate: {
                                path: 'mediator',
                                select: 'username osuId id',
                            },
                        }])
                        .sort({ timestamp: -1 });

                    // check if qa check for previous qualification was done by user and they did not dq it
                    if (a.qualityAssuranceCheckers.includes(req.params.mongoId) && event.userId != userOsuId) {
                        if (a.qualityAssuranceComments) {
                            // add user's qa comment if it exists
                            const qualityAssuranceComment = a.qualityAssuranceComments.find(m => m.mediator.osuId == userOsuId);

                            if (qualityAssuranceComment) {
                                // this isn't part of the model. i'm cheating. sue me
                                event.userQualityAssuranceComment = qualityAssuranceComment.comment;
                            }
                        }

                        disqualifiedQualityAssuranceChecks.push(event);
                    }
                }
            }
        } else if (eventType == 'Popped') {
            for (let j = 0; j < events.length; j++) {
                let event = events[j];

                // check if user's bubble was popped
                if (uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(2);

                    if (a[1].userId == userOsuId) {
                        nominationsPopped.push(event);
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
                    mode: { $in: modes },
                    active: false,
                })
                .populate(applicationPopulate)
                .sort({ createdAt: 1 }),

            EvalRound
                .find({
                    deadline: { $gte: minDate },
                    mode: { $in: modes },
                    active: false,
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

    res.json({ noms: uniqueNominations, nominationsDisqualified, nominationsPopped, disqualifications, pops, qualityAssuranceChecks, disqualifiedQualityAssuranceChecks, assignedApplications, natApplications, natEvalRounds });
});

module.exports = router;
