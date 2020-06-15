const express = require('express');
const Logger = require('../../models/log');
const Report = require('../../models/report');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const User = require('../../models/user');
const Aiess = require('../../models/aiess');
const Note = require('../../models/note');
const { submitEval, setGroupEval, setFeedback, replaceUser } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

//population
const defaultPopulate = [
    {
        path: 'user',
        select: 'username osuId probation modes group',
    },
    {
        path: 'natEvaluators',
        select: 'username osuId',
    },
    {
        path: 'reviews',
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

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    const evalRounds = await BnEvaluation.findActiveEvaluations();

    res.json({
        evaluations: evalRounds,
    });
});

function isValidMode(modeToCheck, isOsu, isTaiko, isCatch, isMania) {
    return ((modeToCheck == 'osu' && isOsu) ||
        (modeToCheck == 'taiko' && isTaiko) ||
        (modeToCheck == 'catch' && isCatch) ||
        (modeToCheck == 'mania' && isMania));
}

/* POST submit or edit eval */
router.post('/addEvalRounds/', middlewares.isNotSpectator, async (req, res) => {
    // TODO missing asigned users in response??
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
        allUsersByMode = allUsersByMode.filter(m => isValidMode(m._id, isOsu, isTaiko, isCatch, isMania));

        if (req.body.excludeUsers) {
            const excludeUsers = req.body.excludeUsers.split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                const userId = parseInt(excludeUsers[i], 10);

                if (isNaN(userId)) {
                    excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
                } else {
                    excludeUsers[i] = userId;
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
                allEvalsToCreate.push({ user: u.id, mode: m._id, deadline });
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
                            allEvalsToCreate.push({ user: u._id, mode: m, deadline });
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
        await BnEvaluation.deleteManyByUserId(round.user);
    }

    // create evalRounds
    const result = await BnEvaluation.insertMany(allEvalsToCreate);

    if (result.error) return res.json(result);

    let ers = await BnEvaluation.findActiveEvaluations();

    res.json({ ers, failed });

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);

    if (deadline < minDate) {
        for (let i = 0; i < result.length; i++) {
            const er = result[i];
            const u = await User.findById(er.user);
            const invalids = [8129817, 3178418, u.osuId];
            const assignedNat = await User.aggregate([
                { $match: { group: 'nat', isSpectator: { $ne: true }, modes: er.mode, osuId: { $nin: invalids } } },
                { $sample: { size: er.mode == 'osu' || er.mode == 'catch' ? 3 : 2 } },
            ]);
            let natList = '';

            for (let i = 0; i < assignedNat.length; i++) {
                let user = assignedNat[i];
                await BnEvaluation.findByIdAndUpdate(er.id, { $push: { natEvaluators: user._id } });
                natList += user.username;

                if (i + 1 < assignedNat.length) {
                    natList += ', ';
                }
            }

            await discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.white,
                    description: `Created [**${u.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${er.id})`,
                    fields: [
                        {
                            name: 'Assigned NAT',
                            value: natList,
                        },
                    ],
                }],
                er.mode
            );
            await util.sleep(500);
        }
    }

    Logger.generate(
        req.session.mongoId,
        `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`
    );
});

/* POST submit or edit eval */
router.post('/submitEval/:id', middlewares.isNotSpectator, async (req, res) => {
    let evaluation = await BnEvaluation
        .findOne({
            _id: req.params.id,
            active: true,
        })
        .populate(defaultPopulate)
        .orFail();

    const isNewEvaluation = await submitEval(
        evaluation,
        req.session,
        req.body.behaviorComment,
        req.body.moddingComment,
        req.body.vote
    );

    evaluation = await BnEvaluation.findById(req.params.id).populate(defaultPopulate);
    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `${isNewEvaluation ? 'Submitted' : 'Updated'} ${evaluation.mode} BN evaluation for "${evaluation.user.username}"`
    );
});

/* POST set group eval */
router.post('/setGroupEval/', middlewares.isNotSpectator, async (req, res) => {
    const evaluations = await BnEvaluation
        .find({
            _id: {
                $in: req.body.checkedRounds,
            },
        })
        .populate(defaultPopulate);

    await setGroupEval(evaluations, req.session);

    let ev = await BnEvaluation.findActiveEvaluations();
    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', middlewares.isNotSpectator, async (req, res) => {
    await BnEvaluation.updateMany({
        _id: { $in: req.body.checkedRounds },
    }, {
        discussion: false,
    });

    let ev = await BnEvaluation.findActiveEvaluations();

    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`
    );
});

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNotSpectator, async (req, res) => {
    const evaluations = await AppEvaluation
        .find({
            _id: {
                $in: req.body.checkedApps,
            },
        })
        .populate(defaultPopulate);

    for (const evaluation of evaluations) {
        let user = await User.findById(evaluation.user);

        if (evaluation.consensus == 'fail') {
            const modeIndex = user.modes.findIndex(m => m == evaluation.mode);
            const probationIndex = user.probation.findIndex(m => m == evaluation.mode);

            if (modeIndex !== -1) {
                user.modes.splice(modeIndex, 1);
            }

            if (probationIndex !== -1) {
                user.modes.splice(probationIndex, 1);
            }

            if (!user.modes.length) {
                if (user.group == 'bn') {
                    user.bnDuration.push(new Date());
                } else if (user.group == 'nat') {
                    user.natDuration.push(new Date());
                }

                user.group = 'user';
            }

            await user.save();
        }

        else if (evaluation.consensus == 'probation') {
            if (!user.probation.includes(evaluation.mode)) {
                user.probation.push(evaluation.mode);
                await user.save();
            }

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
            });
        }

        else if (evaluation.consensus == 'pass') {
            const i = user.probation.findIndex(m => m == evaluation.mode);

            if (i !== -1) {
                user.probation.splice(i, 1);
            }

            let deadline = new Date();

            if (evaluation.isLowActivity) {
                deadline.setDate(deadline.getDate() + 40);
            } else {
                deadline.setDate(deadline.getDate() + 100);

                // process user group changes
                if (evaluation.isMoveToNat || evaluation.isMoveToBn) {
                    user.group = evaluation.isMoveToNat ? 'nat' : 'bn';
                    user.probation = [];
                    user.bnDuration.push(new Date());
                    user.natDuration.push(new Date());
                }
            }

            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
            });
        }

        evaluation.active = false;
        await evaluation.save();

        let consensusText;

        if (evaluation.consensus == 'pass') {
            consensusText = 'Pass';

            if (evaluation.isLowActivity) {
                consensusText += ' + Low activity warning';
            } else if (evaluation.isMoveToNat) {
                consensusText += ' + Move to NAT';
            } else if (evaluation.isMoveToBn) {
                consensusText += ' + Move to BN';
            }
        } else if (evaluation.consensus == 'probation') {
            consensusText = 'Probation';
        } else if (evaluation.consensus == 'fail') {
            consensusText = 'Fail';

            if (evaluation.resignedOnGoodTerms) {
                consensusText += ' + Resigned on good terms';
            }
        } else {
            consensusText = 'No consensus set';
        }

        Logger.generate(
            req.session.mongoId,
            `Set ${user.username}'s ${evaluation.mode} BN eval as "${consensusText}"`
        );

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.black,
                description: `Archived [**${user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) with **${consensusText}** consensus`,
            }],
            evaluation.mode
        );
    }

    let ev = await BnEvaluation.findActiveEvaluations();

    res.json(ev);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', middlewares.isNotSpectator, async (req, res) => {
    let evaluation = await BnEvaluation
        .findByIdAndUpdate(req.params.id, {
            consensus: req.body.consensus,
            isLowActivity: req.body.isLowActivity ? true : false,
            resignedOnGoodTerms: req.body.resignedOnGoodTerms ? true : false,
            resignedOnStandardTerms: req.body.resignedOnStandardTerms ? true : false,
            isMoveToNat: req.body.isMoveToNat ? true : false,
            isMoveToBn: req.body.isMoveToBn ? true : false,
        })
        .populate(defaultPopulate)
        .orFail();

    if (req.body.consensus == 'fail') {
        let date = new Date(evaluation.updatedAt);
        date.setDate(date.getDate() + 90);
        evaluation.cooldownDate = date;
        await evaluation.save();
    }

    res.json(evaluation);

    let consensusText;

    if (evaluation.consensus == 'pass') {
        consensusText = 'Pass';

        if (evaluation.isLowActivity) {
            consensusText += ' + Low activity warning';
        } else if (evaluation.isMoveToNat) {
            consensusText += ' + Move to NAT';
        } else if (evaluation.isMoveToBn) {
            consensusText += ' + Move to BN';
        }
    } else if (evaluation.consensus == 'probation') {
        consensusText = 'Probation';
    } else if (evaluation.consensus == 'fail') {
        consensusText = 'Fail';

        if (evaluation.resignedOnGoodTerms) {
            consensusText += ' + Resigned on good terms';
        } else if (evaluation.resignedOnStandardTerms) {
            consensusText += ' + Resigned on standard terms';
        }
    } else {
        consensusText = 'No consensus set';
    }

    Logger.generate(
        req.session.mongoId,`Set consensus of ${evaluation.user.username}'s ${evaluation.mode} BN eval as "${consensusText}"`
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightBlue,
            description: `[**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) set to **${consensusText}**`,
        }],
        evaluation.mode
    );
});

/* POST set cooldown */
router.post('/setCooldownDate/:id', middlewares.isNotSpectator, async (req, res) => {
    let evaluation = await BnEvaluation
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${evaluation.user.username}'s ${evaluation.mode} current BN evaluation`
    );
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkBlue,
            description: `**${evaluation.user.username}**'s re-application date set to **${req.body.cooldownDate.toString().slice(0,10)}**`,
        }],
        evaluation.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', middlewares.isNotSpectator, async (req, res) => {
    let evaluation = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation = await setFeedback(evaluation, req.body.feedback, req.session);
    res.json(evaluation);
});

/* GET find previous evaluations */
router.get('/findPreviousEvaluations/:userId', async (req, res) => {
    const evalRounds = await BnEvaluation.find({
        user: req.params.userId,
        active: false,
        consensus: { $exists: true },
        feedback: { $exists: true },
    });

    const applications = await AppEvaluation.find({
        user: req.params.userId,
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
router.get('/findUserNotes/:id', async (req, res) => {
    const userNotes = await Note
        .find({
            user: req.params.id,
            isHidden: { $ne: true },
        })
        .populate(notesPopulate);

    res.json({ userNotes });
});

/* GET find user reports */
router.get('/findUserReports/:id', async (req, res) => {
    const userReports = await Report.find({
        culprit: req.params.id,
        isActive: { $ne: true },
    });

    res.json({ userReports });
});

/* POST replace evaluator */
router.post('/replaceUser/:id', middlewares.isNotSpectator, async (req, res) => {
    let evaluation = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    let newEvaluator = await replaceUser(evaluation, res.locals.userRequest, req.body.evaluatorId);
    evaluation = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        'Re-selected an evaluator on current BN eval'
    );

    const user = await User.findById(req.body.evaluatorId);

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.orange,
            description: `Replaced **${user.username}** with **${newEvaluator.username}** as NAT evaluator for [**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
        }],
        evaluation.mode
    );
});

async function getGeneralEvents (osuIdInput, mongoId, modes, minDate, maxDate) {
    const userOsuId = parseInt(osuIdInput);

    if (isNaN(osuIdInput)) {
        return { error: 'Something went wrong!' };
    }

    const [allUserEvents, allEventsByType, qualityAssuranceChecks] = await Promise.all([
        Aiess.getByEventTypeAndUser(userOsuId, minDate, maxDate, modes),
        Aiess.getAllByEventType(minDate, maxDate, modes),
        Aiess.find({
            qualityAssuranceCheckers: mongoId,
            updatedAt: { $gte: minDate, $lte: maxDate },
        }),
    ]);

    if (allUserEvents.error || allEventsByType.error) {
        return { error: 'Something went wrong!' };
    }

    // sort events done by user by type
    let nominations = [];
    let disqualifications = [];
    let pops = [];

    allUserEvents.forEach(userEvent => {
        const eventType = userEvent._id;
        const events = userEvent.events;

        if (eventType == 'Qualified' || eventType == 'Bubbled') {
            nominations = [...events, ...nominations];
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
    uniqueNominations = nominations.filter(event => !uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId));

    // find user's disqualified/popped nominations & disqualified qa checks
    let nominationsDisqualified = [];
    let nominationsPopped = [];
    let disqualifiedQualityAssuranceChecks = [];

    for (let i = 0; i < allEventsByType.length; i++) {
        const eventType = allEventsByType[i]._id;
        const events = allEventsByType[i].events;

        if (eventType == 'Disqualified') {
            for (const event of events) {
                // check if user's nomination was disqualified
                if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(3);

                    // check if user was the nominator
                    if ((a[1] && a[1].userId == userOsuId) || (a[2] && a[2].userId == userOsuId)) {
                        nominationsDisqualified.push(event);
                    }

                // check if user's quality assurance check was later disqualified
                } else if (qualityAssuranceChecks.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
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
                    if (a.qualityAssuranceCheckers.includes(mongoId) && event.userId != userOsuId) {
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
            for (const event of events) {
                // check if user's bubble was popped
                if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
                    let a = await Aiess
                        .find({
                            beatmapsetId: event.beatmapsetId,
                            timestamp: { $lte: event.timestamp },
                            eventType: { $ne: 'Reported' },
                        })
                        .sort({ timestamp: -1 })
                        .limit(2);

                    if (a[1] && a[1].userId == userOsuId) {
                        nominationsPopped.push(event);
                    }
                }
            }
        }
    }

    return {
        uniqueNominations,
        nominationsDisqualified,
        nominationsPopped,
        disqualifications,
        pops,
        disqualifiedQualityAssuranceChecks,
    };
}

const applicationPopulate = [
    {
        path: 'user',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

/* GET aiess info */
router.get('/activity/:osuId/:modes/:deadline/:mongoId', async (req, res) => {
    const mongoId = req.params.mongoId;
    const modes = req.params.modes.split(',');
    let deadline = parseInt(req.params.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(deadline);

    const [user, assignedApplications] = await Promise.all([
        User.findById(req.params.mongoId).orFail(),
        AppEvaluation
            .find({
                bnEvaluators: mongoId,
                mode: req.params.mode,
                createdAt: { $gte: minDate },
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),
    ]);

    let natApplications = [];
    let natEvalRounds = [];

    // find all applications & evalRounds
    const [allApplications, allEvalRounds] = await Promise.all([
        AppEvaluation
            .find({
                createdAt: { $gte: minDate },
                mode: { $in: modes },
                active: false,
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),

        BnEvaluation
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
        for (let i = 0; i < application.reviews.length; i++) {
            const review = application.reviews[i];

            if (review.evaluator.id == user.id || (application.natEvaluators && application.natEvaluators.includes(user.id))) {
                natApplications.push(application);
                break;
            }
        }
    });

    // extract evalRounds that user evaluated or was assigned to
    allEvalRounds.forEach(evalRound => {
        for (let i = 0; i < evalRound.reviews.length; i++) {
            const review = evalRound.reviews[i];

            if (review.evaluator.id == user.id || (evalRound.natEvaluators && evalRound.natEvaluators.includes(user.id))) {
                natEvalRounds.push(evalRound);
                break;
            }
        }
    });

    res.json({
        ...await getGeneralEvents(req.params.osuId, mongoId, modes, minDate, maxDate),
        assignedApplications,
        natApplications,
        natEvalRounds,
    });
});

module.exports = { router, getGeneralEvents };
