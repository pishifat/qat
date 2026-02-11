const express = require('express');
const moment = require('moment');
const Logger = require('../../models/log');
const Report = require('../../models/report');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const ResignationEvaluation = require('../../models/evaluations/resignationEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const User = require('../../models/user');
const Aiess = require('../../models/aiess');
const QualityAssuranceCheck = require('../../models/qualityAssuranceCheck');
const Note = require('../../models/note');
const { submitEval, submitMockEval, selectMockEvaluators, setGroupEval, setFeedback, replaceUser } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const { BnEvaluationConsensus, BnEvaluationAddition, ResignationConsensus, Cooldown } = require('../../shared/enums');
const osuBot = require('../../helpers/osuBot');
const Settings = require('../../models/settings');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasBasicAccess);

//population
const defaultPopulate = [
    {
        path: 'user',
        select: 'username osuId modesInfo groups evaluatorModes subjectiveEvalFeedback',
    },
    {
        path: 'natEvaluators',
        select: 'username osuId',
    },
    {
        path: 'bnEvaluators',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
    {
        path: 'mockEvaluators',
        select: 'username osuId discordId isBnEvaluator',
    },
    {
        path: 'mockReviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat discordId isBnEvaluator',
        },
    },
    {
        path: 'rerolls',
        populate: [
            {
                path: 'oldEvaluator',
                select: 'username osuId',
            },
            {
                path: 'newEvaluator',
                select: 'username osuId',
            },
        ],
    }
];

const notesPopulate = [
    { path: 'author', select: 'username osuId' },
];

/* GET current BN eval listing. */
router.get('/relevantInfo', async (req, res) => {
    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat, res.locals.userRequest.isTrialNat);

    // Strip reviews field for mock evaluators on active evaluations
    const processedEvaluations = evaluations.map(evaluation => {
        // Check if current user is a mock evaluator and evaluation is active
        const isMockEvaluator = evaluation.mockEvaluators && 
            evaluation.mockEvaluators.some(mockEvaluator => 
                mockEvaluator._id.toString() === req.session.mongoId
            );
        
        if (isMockEvaluator && evaluation.active) {
            // Create a copy without the reviews field
            const evalCopy = evaluation.toObject();
            delete evalCopy.reviews;
            return evalCopy;
        }
        
        return evaluation;
    });

    res.json({
        evaluations: processedEvaluations,
    });
});

function isValidMode(modeToCheck, isOsu, isTaiko, isCatch, isMania) {
    return ((modeToCheck == 'osu' && isOsu) ||
        (modeToCheck == 'taiko' && isTaiko) ||
        (modeToCheck == 'catch' && isCatch) ||
        (modeToCheck == 'mania' && isMania));
}

/* POST manually create eval */
router.post('/addEvaluations/', middlewares.isNat, async (req, res) => {
    const includeFullBns = req.body.groups.includes('fullBn');
    const includeProbationBns = req.body.groups.includes('probationBn');
    const includeNat = req.body.groups.includes('nat');
    const isOsu = req.body.modes.includes('osu');
    const isTaiko = req.body.modes.includes('taiko');
    const isCatch = req.body.modes.includes('catch');
    const isMania = req.body.modes.includes('mania');
    const isResignation = req.body.isResignation;
    const deadline = isResignation ? new Date() : new Date(req.body.deadline); // deadline for resignations is Today
    let allEvalsToCreate = [];
    let failed = [];

    // if user groups are selected
    let allUsersByMode = await User.getAllByMode(includeFullBns, includeProbationBns, includeNat);

    if (allUsersByMode.error) {
        return {
            error: 'Something went wrong',
        };
    }

    if (allUsersByMode.length) {
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
            const u = await User.findByUsernameOrOsuId(userToSearch);

            if (u) {
                if (u.modes) {
                    u.modes.forEach(m => {
                        if (isValidMode(m, isOsu, isTaiko, isCatch, isMania)) {
                            allEvalsToCreate.push({ user: u._id, mode: m, deadline });
                        }
                    });
                }
            } else {
                failed.push(userToSearch);
            }
        }
    }

    if (!allEvalsToCreate.length) {
        return res.json({ error: 'No evaluations generated' });
    }

    // delete scheduled BnEvaluations/ResignationEvaluations
    for (let i = 0; i < allEvalsToCreate.length; i++) {
        const round = allEvalsToCreate[i];
        await Evaluation.deleteUserActiveEvaluations(round.user, round.mode);
    }

    // create BnEvaluations or Resignations
    const result = isResignation ? await ResignationEvaluation.insertMany(allEvalsToCreate) : await BnEvaluation.insertMany(allEvalsToCreate);

    if (!result.length) return res.json({
        error: `Didn't create any`,
    });

    // assign users
    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);

    if (deadline < minDate) {
        for (let i = 0; i < result.length; i++) {
            const er = result[i];
            const u = await User.findById(er.user);
            const assignedNat = u.isNat ? [u] : await User.getAssignedNat(er.mode, u.id, [u.osuId]);
            er.natEvaluators = assignedNat;
            await er.populate(defaultPopulate).execPopulate();

            const assignments = [];

            for (const user of assignedNat) {
                assignments.push({
                    date: new Date(),
                    user: user._id,
                });
            }

            let fields = [];
            const natList = assignedNat.map(u => u.username).join(', ');
            
            fields.push({
                name: 'Assigned NAT',
                value: natList,
            });

            let discordIds = assignedNat.map(n => n.discordId).filter(d => d);

            // assign trial NAT
            if (await Settings.getModeHasTrialNat(er.mode)) {
                const assignedTrialNat = await User.getAssignedTrialNat(er.mode);
                er.bnEvaluators = assignedTrialNat;
                const trialNatList = assignedTrialNat.map(n => n.username).join(', ');
                fields.push({
                    name: 'Assigned BN',
                    value: trialNatList,
                });
                discordIds = discordIds.concat(assignedTrialNat.map(n => n.discordId).filter(d => d));
            }

            await er.save();

            await discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.white,
                    description: `Created [**${u.username}**'s ${u.isNat ? 'NAT' : isResignation ? 'resignation' : 'current BN'} eval](http://bn.mappersguild.com/bneval?id=${er.id})`,
                    fields,
                }],
                er.mode
            );
            await util.sleep(500);

            await discord.userHighlightWebhookPost(er.mode, discordIds);
        }
    }

    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, true);

    res.json({
        evaluations,
        failed,
        success: 'Generated evaluations!',
    });

    Logger.generate(
        req.session.mongoId,
        `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`,
        'bnEvaluation'
    );
});

/* POST submit or edit eval */
router.post('/submitEval/:id', async (req, res) => {
    let evaluation = await Evaluation
        .findOne({
            _id: req.params.id,
            active: true,
        })
        .populate(defaultPopulate)
        .orFail();

    let isNewEvaluation;
    let isMockEvaluator = evaluation.mockEvaluators.some(u => u.id == req.session.mongoId);

    if (isMockEvaluator) {
        isNewEvaluation = await submitMockEval(
            evaluation,
            req.session,
            req.body.moddingComment,
            req.body.vote,
        );
    } else {
        isNewEvaluation = await submitEval(
            evaluation,
            req.session,
            res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat,
            req.body.moddingComment,
            req.body.vote,
        );
    }

    evaluation = await Evaluation.findById(req.params.id).populate(defaultPopulate);
    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `${isNewEvaluation ? 'Submitted' : 'Updated'} ${evaluation.mode} BN ${isMockEvaluator ? 'mock' : ''} evaluation for "${evaluation.user.username}"`,
        'bnEvaluation',
        evaluation._id
    );
});

/* POST set group eval */
router.post('/setGroupEval/', middlewares.isNat, async (req, res) => {
    let evaluations = await Evaluation
        .find({
            _id: {
                $in: req.body.evalIds,
            },
        })
        .populate(defaultPopulate);

    await setGroupEval(evaluations, req.session);
    evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, true);
    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN eval${req.body.evalIds.length == 1 ? '' : 's'} as group evaluation`,
        'bnEvaluation'
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', middlewares.isNat, async (req, res) => {
    await Evaluation.updateMany({
        _id: { $in: req.body.evalIds },
    }, {
        discussion: false,
    });

    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, true);

    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN eval${req.body.evalIds.length == 1 ? '' : 's'} as individual evaluation`,
        'bnEvaluation'
    );
});

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluations = await Evaluation
        .find({
            _id: {
                $in: req.body.evalIds,
            },
            active: true,
        })
        .populate(defaultPopulate);

    for (const evaluation of evaluations) {
        let resetSession = false;
        let user = await User.findById(evaluation.user);
        const i = user.modesInfo.findIndex(m => m.mode === evaluation.mode);

        // nat evaluation processing
        if (user.evaluatorModes.includes(evaluation.mode) || user.evaluatorModes.includes('none')) {
            const userGroup = req.body.userGroup || 'nat';

            if (userGroup == 'nat') {
                const random75 = Math.round(Math.random() * (80 - 70) + 70); // between 70 and 80 days
                let deadline = new Date();
                deadline.setDate(deadline.getDate() + random75);

                await BnEvaluation.create({
                    user: evaluation.user,
                    mode: evaluation.mode == 'none' ? 'osu' : evaluation.mode,
                    deadline,
                    activityToCheck: random75,
                    natEvaluators: [evaluation.user],
                });

                evaluation.consensus = BnEvaluationConsensus.RemainInNat;
                evaluation.feedback = 'None';
                evaluation.isReviewed = true;
            } else if (userGroup == 'bn') {
                user.history.push({
                    date: new Date(),
                    mode: evaluation.mode,
                    kind: 'left',
                    group: 'nat',
                    relatedEvaluation: evaluation._id,
                });

                user.history.push({
                    date: new Date(),
                    mode: evaluation.mode,
                    kind: 'joined',
                    group: 'bn',
                    relatedEvaluation: evaluation._id,
                });

                const natIndex = user.groups.findIndex(g => g === 'nat');

                if (natIndex !== -1) {
                    user.groups.splice(natIndex, 1);
                }

                const bnIndex = user.groups.findIndex(g => g === 'bn');

                if (bnIndex == -1) {
                    user.groups.push('bn');
                }
    
                user.isTrialNat = false;
                user.modesInfo[i].level = 'full';

                await user.save();

                let deadline = new Date();
                let activityToCheck = 90;
                deadline.setDate(deadline.getDate() + activityToCheck);
                

                await BnEvaluation.create({
                    user: evaluation.user,
                    mode: evaluation.mode,
                    deadline,
                    activityToCheck,
                });

                evaluation.consensus = BnEvaluationConsensus.MoveToBn;
                resetSession = true;
                evaluation.feedback = 'None';
                evaluation.isReviewed = true;
            } else if (userGroup == 'user') {
                user.history.push({
                    date: new Date(),
                    mode: evaluation.mode,
                    kind: 'left',
                    group: 'nat',
                    relatedEvaluation: evaluation._id,
                });

                user.isTrialNat = false;

                const natIndex = user.groups.findIndex(g => g === 'nat');

                if (natIndex !== -1) {
                    user.groups.splice(natIndex, 1);
                }

                if (i !== -1) {
                    user.modesInfo.splice(i, 1);
                }

                await user.save();

                evaluation.consensus = BnEvaluationConsensus.RemoveFromNat;
                resetSession = true;
                evaluation.feedback = 'None';
                evaluation.isReviewed = true;
            }
        }

        // bn evaluation processing
        else if (evaluation.consensus === BnEvaluationConsensus.RemoveFromBn || (evaluation.isResignation && evaluation.consensus)) {
            if (i !== -1) {
                user.modesInfo.splice(i, 1);
            }

            if (!user.modesInfo.length) {
                const bnIndex = user.groups.findIndex(g => g === 'bn');

                if (bnIndex !== -1) {
                    user.groups.splice(bnIndex, 1);
                }

                const natIndex = user.groups.findIndex(g => g === 'nat');

                if (natIndex !== -1 && bnIndex == -1) {
                    user.groups.splice(natIndex, 1);
                }
            }

            user.history.push({
                date: new Date(),
                mode: evaluation.mode,
                kind: 'left',
                group: user.isNat ? 'nat' : 'bn',
                relatedEvaluation: evaluation._id,
            });

            user.isTrialNat = false;

            await user.save();
        }

        else if (evaluation.consensus === BnEvaluationConsensus.ProbationBn) {
            if (i !== -1 && user.modesInfo[i].level === 'full') {
                user.modesInfo.splice(i, 1, {
                    mode: evaluation.mode,
                    level: 'probation',
                });

                user.isTrialNat = false;

                await user.save();
            }

            let activityToCheck = 37;
            let deadline = new Date();
            deadline.setDate(deadline.getDate() + activityToCheck);
            
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck,
            });
        }

        else if (evaluation.consensus === BnEvaluationConsensus.FullBn) {
            if (i !== -1 && user.modesInfo[i].level === 'probation') {
                user.modesInfo.splice(i, 1, {
                    mode: evaluation.mode,
                    level: 'full',
                });
            }

            let deadline = new Date();
            let activityToCheck = 90;

            if (evaluation.addition === BnEvaluationAddition.LowActivityWarning) {
                deadline.setDate(deadline.getDate() + 37); // +37 days
            } else {
                const random90 = Math.round(Math.random() * (95 - 85) + 85); // between 85 and 95 days
                deadline.setDate(deadline.getDate() + random90);
                activityToCheck = random90;
            }

            await user.save();
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck,
            });
        }

        evaluation.active = false;
        evaluation.archivedAt = new Date();
        await evaluation.save();

        // nat eval logs
        if (user.isNat) {
            const userGroup = req.body.userGroup || 'nat';

            Logger.generate(
                req.session.mongoId,
                `Archived ${user.username}'s ${evaluation.mode} NAT eval (Usergroup: ${userGroup.toUpperCase()})"`,
                'bnEvaluation',
                evaluation._id
            );

            discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.black,
                    description: `Archived [**${user.username}**'s NAT eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}). Usergroup: **${userGroup.toUpperCase()}**`,
                }],
                evaluation.mode
            );
        }

        // bn eval logs
        else {
            const consensusText = util.makeWordFromField(evaluation.consensus);
            const additionText = util.makeWordFromField(evaluation.addition);

            Logger.generate(
                req.session.mongoId,
                `Archived  ${user.username}'s ${evaluation.mode} ${evaluation.isResignation ? 'resignation' : 'BN eval'} as "${consensusText}"`,
                'bnEvaluation',
                evaluation._id
            );

            discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.black,
                    description: `Archived [**${user.username}**'s ${evaluation.isResignation ? 'resignation' : 'current BN'} eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) with **${consensusText}** consensus and **${additionText}** addition.`,
                }],
                evaluation.mode
            );
        }

        if (resetSession) await util.invalidateSessions(user.id);
    }

    evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, true);

    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN eval${req.body.evalIds.length == 1 ? '' : 's'} as completed`,
        'bnEvaluation'
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation.consensus = req.body.consensus;

    if (req.body.consensus === BnEvaluationConsensus.RemoveFromBn || evaluation.isResignation) {
        const date = new Date();

        if (
            req.body.consensus == ResignationConsensus.ResignedOnStandardTerms ||
            (req.body.consensus == BnEvaluationConsensus.RemoveFromBn &&
                evaluation.addition != BnEvaluationAddition.LowActivityWarning)
        ) {
            date.setDate(date.getDate() + 60);
        }

        evaluation.cooldownDate = date;
    }

    await evaluation.save();
    res.json(evaluation);

    const consensusText = util.makeWordFromField(evaluation.consensus);

    Logger.generate(
        req.session.mongoId,
        `Set consensus of ${evaluation.user.username}'s ${evaluation.mode} ${evaluation.isResignation ? 'resignation' : 'BN eval'} as "${consensusText}"`,
        'bnEvaluation',
        evaluation._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightBlue,
            description: `[**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) consensus set to **${consensusText}**`,
        }],
        evaluation.mode
    );
});

/* POST set addition of eval */
router.post('/setAddition/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const evaluation = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation.addition = req.body.addition;

    if (evaluation.consensus === BnEvaluationConsensus.RemoveFromBn) {
        const date = new Date();
        date.setDate(date.getDate() + 60);
        evaluation.cooldownDate = date;
    }

    await evaluation.save();
    res.json(evaluation);

    const additionText = util.makeWordFromField(evaluation.addition);

    Logger.generate(
        req.session.mongoId,
        `Set addition of ${evaluation.user.username}'s ${evaluation.mode} BN eval as "${additionText}"`,
        'bnEvaluation',
        evaluation._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightBlue,
            description: `[**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) addition set to **${additionText}**`,
        }],
        evaluation.mode
    );
});

/* POST set feedback of eval */
router.post('/setFeedback/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation = await setFeedback(evaluation, req.body.feedback, req.session);
    res.json(evaluation);
});

/* GET find previous evaluations */
router.get('/findPreviousEvaluations/:userId', middlewares.isNatOrTrialNat, async (req, res) => {
    const evaluations = await Evaluation.find({
        user: req.params.userId,
        active: false,
        consensus: { $exists: true },
    });

    const applications = await AppEvaluation.find({
        user: req.params.userId,
        active: false,
        consensus: { $exists: true },
        feedback: { $exists: true },
    });

    let previousEvaluations = evaluations.concat(applications);

    if (evaluations.length && applications.length) {
        previousEvaluations.sort((a, b) => {
            const dateA = (a.archivedAt ? a.archivedAt : a.deadline);
            const dateB = (b.archivedAt ? b.archivedAt : b.deadline);
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            return 0;
        });
    }

    res.json({ previousEvaluations });
});

/* GET find user notes */
router.get('/findUserNotes/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const userNotes = await Note
        .find({
            user: req.params.id,
            isHidden: { $ne: true },
        })
        .sort({ createdAt: -1 })
        .populate(notesPopulate);

    res.json({ userNotes });
});

/* GET find user reports */
router.get('/findUserReports/:id', middlewares.isNat, async (req, res) => {
    const userReports = await Report.find({
        culprit: req.params.id,
        isActive: { $ne: true },
    });

    res.json({ userReports });
});

/* POST replace evaluator */
router.post('/replaceUser/:id', middlewares.isNat, async (req, res) => {
    const replaceNat = Boolean(req.body.replaceNat);
    let evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    let newEvaluator = await replaceUser(evaluation, res.locals.userRequest.id, req.body.evaluatorId, !replaceNat, req.body.selectedUserId);

    evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(evaluation);

    Logger.generate(
        req.session.mongoId,
        'Re-selected an evaluator on current BN eval',
        'bnEvaluation',
        evaluation._id
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

    // get base data
    const [uniqueNominations, disqualifications, pops, qualityAssuranceChecks, uniqueNominations3Months] = await Promise.all([
        Aiess.getUniqueUserEvents(userOsuId, minDate, maxDate, modes, ['nominate', 'qualify']),
        Aiess.getUserEvents(userOsuId, minDate, maxDate, modes, ['disqualify']),
        Aiess.getUserEvents(userOsuId, minDate, maxDate, modes, ['nomination_reset']),
        QualityAssuranceCheck
            .find({
                user: mongoId,
                timestamp: { $gt: minDate, $lt: maxDate },
            }).populate({
                path: 'event',
                select: 'beatmapsetId timestamp modes artistTitle creatorName creatorId',
            }),
        Aiess.getUniqueUserEvents(userOsuId, new Date(moment().subtract(3, 'months').startOf('month')), new Date(), modes, ['nominate', 'qualify']),
    ]);

    const beatmapsetIds = uniqueNominations.map(n => n.beatmapsetId);
    const qaBeatmapsetIds = qualityAssuranceChecks.map(qa => qa.event.beatmapsetId);

    // get data that requires base data
    let [allNominationsDisqualified, allNominationsPopped, disqualifiedQualityAssuranceChecks] = await Promise.all([
        Aiess.getRelatedBeatmapsetEvents(
            userOsuId,
            beatmapsetIds,
            minDate,
            maxDate,
            modes,
            'disqualify'
        ),
        Aiess.getRelatedBeatmapsetEvents(
            userOsuId,
            beatmapsetIds,
            minDate,
            maxDate,
            modes,
            'nomination_reset'
        ),
        Aiess.find({
            beatmapsetId: { $in: qaBeatmapsetIds },
            timestamp: { $gt: minDate, $lt: maxDate },
            type: 'disqualify',
        }),
    ]);

    // filter nominationsPopped
    let nominationsPopped = [];

    for (const event of allNominationsPopped) {
        if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
            let a = await Aiess
                .find({
                    beatmapsetId: event.beatmapsetId,
                    timestamp: { $lt: event.timestamp },
                    $and: [
                        { type: { $ne: 'rank' } },
                        { type: { $ne: 'disqualify' } },
                        { type: { $ne: 'nomination_reset' } },
                        { type: { $exists: true } },
                    ],
                })
                .sort({ timestamp: -1 })
                .limit(1);

            if (a[0] && a[0].userId == userOsuId) {
                nominationsPopped.push(event);
            }
        }
    }

    // filter nominationsDisqualified
    let nominationsDisqualified = [];

    for (const event of allNominationsDisqualified) {
        if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
            let a = await Aiess
                .find({
                    beatmapsetId: event.beatmapsetId,
                    timestamp: { $lt: event.timestamp },
                    $and: [
                        { type: { $ne: 'rank' } },
                        { type: { $ne: 'disqualify' } },
                        { type: { $ne: 'nomination_reset' } },
                        { type: { $exists: true } },
                    ],
                })
                .sort({ timestamp: -1 })
                .limit(event.type == 'nomination_reset' ? 1 : 2);

            if ((a[0] && a[0].userId == userOsuId) || (a[1] && a[1].userId == userOsuId)) {
                nominationsDisqualified.push(event);
            }
        }
    }

    // filter disqualifiedQualityAssuranceChecks
    disqualifiedQualityAssuranceChecks = disqualifiedQualityAssuranceChecks.filter(dq =>
        qualityAssuranceChecks.some(qa => qa.event.beatmapsetId == dq.beatmapsetId && qa.event.timestamp < dq.timestamp)
    );

    // set qa comments for dq'd qa checks
    for (let i = 0; i < disqualifiedQualityAssuranceChecks.length; i++) {
        const event = disqualifiedQualityAssuranceChecks[i];

        const relatedQaCheck = qualityAssuranceChecks.find(qa =>
            qa.event.beatmapsetId == event.beatmapsetId && qa.event.timestamp < event.timestamp
        );

        if (relatedQaCheck && relatedQaCheck.comment && relatedQaCheck.comment.length) {
            disqualifiedQualityAssuranceChecks[i].qaComment = relatedQaCheck.comment;
        }
    }

    // find unique nominations per month for the last 3 months and current month (for activity standing display)
    const month1Nominations = [];
    const month2Nominations = [];
    const month3Nominations = [];
    const currentMonthNominations = [];

    const month1Start = moment().subtract(3, 'months').startOf('month');
    const month2Start = moment().subtract(2, 'months').startOf('month');
    const month3Start = moment().subtract(1, 'months').startOf('month');
    const currentMonthStart = moment().startOf('month');
    const today = new Date();

    for (const nomination of uniqueNominations3Months) {
        const timestamp = new Date(nomination.timestamp);
        if (timestamp >= month1Start && timestamp < month2Start) {
            month1Nominations.push(nomination);
        } else if (timestamp >= month2Start && timestamp < month3Start) {
            month2Nominations.push(nomination);
        } else if (timestamp >= month3Start && timestamp < currentMonthStart) {
            month3Nominations.push(nomination);
        } else if (timestamp >= currentMonthStart && timestamp < today) {
            currentMonthNominations.push(nomination);
        }
    }

    return {
        uniqueNominations,
        nominationsDisqualified,
        nominationsPopped,
        disqualifications,
        pops,
        qualityAssuranceChecks,
        disqualifiedQualityAssuranceChecks,
        month1Nominations: month1Nominations.length,
        month2Nominations: month2Nominations.length,
        month3Nominations: month3Nominations.length,
        currentMonthNominations: currentMonthNominations.length,
    };
}

const applicationPopulate = [
    {
        path: 'user',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
    {
        path: 'mockReviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
    {
        path: 'rerolls',
        populate: [
            {
                path: 'oldEvaluator',
                select: 'username osuId',
            },
            {
                path: 'newEvaluator',
                select: 'username osuId',
            },
        ],
    }
];

const evaluationPopulate = [
    {
        path: 'user',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
    {
        path: 'mockReviews',
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
    {
        path: 'rerolls',
        populate: [
            {
                path: 'oldEvaluator',
                select: 'username osuId',
            },
            {
                path: 'newEvaluator',
                select: 'username osuId',
            },
        ],
    }
];

/* GET aiess info */
router.get('/activity', async (req, res) => {
    let days = parseInt(req.query.days);
    if (isNaN(days)) days = 90;
    else if (days > 10000) days = 9999;
    else if (days < 2) days = 2;

    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');

    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date(deadline);

    /**
     * appEvaluations: a NAT's evaluations of applications
     * bnEvaluations: a NAT's evaluations of current BNs
     * assignedBnApplications: a BN's assigned applications for evaluations (but not mock evaluations)
     * mockAppEvaluations: a BN's mock evaluations of applications
     * mockBnEvaluations: a BN's mock evaluations of current BNs
     */
    let [appEvaluations, bnEvaluations, assignedBnApplications, mockAppEvaluations, mockBnEvaluations] = await Promise.all([
        AppEvaluation
            .find({
                createdAt: { $gt: minDate },
                mode: { $in: modes },
                active: false,
                bnEvaluators: { $ne: mongoId },
            })
            .populate(applicationPopulate)
            .sort({ deadline: 1 }),
        Evaluation
            .find({
                deadline: { $gt: minDate },
                mode: { $in: modes },
                active: false,
            })
            .populate(evaluationPopulate)
            .sort({ deadline: 1 }),
        AppEvaluation
            .find({
                bnEvaluators: mongoId,
                mode: modes,
                createdAt: { $gt: minDate },
                discussion: true,
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),
        AppEvaluation
            .find({
                mockEvaluators: mongoId,
                mode: modes,
                archivedAt: { $gt: minDate },
                discussion: true,
                active: false,
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),
        Evaluation
            .find({
                mockEvaluators: mongoId,
                mode: modes,
                archivedAt: { $gt: minDate },
                discussion: true,
                active: false,
            })
            .populate(evaluationPopulate)
            .sort({ createdAt: 1 }),
    ]);

    // extract apps that NAT evaluated or was assigned to
    appEvaluations = appEvaluations.filter(a =>
        a.reviews.some(r => r.evaluator.id == mongoId || a.natEvaluators.includes(mongoId))
    );

    // extract BnEvaluations/Resignations that NAT evaluated or was assigned to
    bnEvaluations = bnEvaluations.filter(e =>
        e.reviews.some(r => r.evaluator.id == mongoId || e.natEvaluators.includes(mongoId))
    );

    // extract apps that BN did mock eval for
    mockAppEvaluations = mockAppEvaluations.filter(a =>
        a.mockReviews.some(r => r.evaluator.id == mongoId)
    );

    // extract BnEvaluations/Resignations that BN did mock eval for
    mockBnEvaluations = mockBnEvaluations.filter(e =>
        e.mockReviews.some(r => r.evaluator.id == mongoId)
    );

    res.json({
        ...await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate),
        assignedBnApplications,
        appEvaluations,
        bnEvaluations,
        mockAppEvaluations,
        mockBnEvaluations,
    });
});

/* POST send messages */
router.post('/sendMessages/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    req.body.users.push({ osuId: req.session.osuId });

    const osuIds = req.body.users.map(user => user.osuId);

    let channel;

    if (req.body.type == 'enable mock evaluations') {
        channel = {
            name: `BN Mock Eval (${evaluation.mode == 'osu' ? 'osu!' : `osu!${evaluation.mode}`})`,
            description: `Invite to participate in a mock evaluation of a BN evaluation`,
        }
    } else {
        channel = {
            name: `BN Eval Results (${evaluation.mode == 'osu' ? 'osu!' : `osu!${evaluation.mode}`})`,
            description: `Results for your recent BN evaluation (${moment(evaluation.createdAt).format('YYYY-MM-DD')})`,
        }
    }

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: message.error ? message.error : `Messages were not sent.` });
    }

    res.json({ success: 'Messages sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Sent ${req.body.type} chat messages for current BN eval for "${evaluation.user.username}"`,
        'bnEvaluation',
        evaluation._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.white,
        description: `Sent **${req.body.type}** chat messages for [**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/appeval?id=${evaluation.id})`,
    }],
    evaluation.mode);
});

/* POST toggle isReviewed for evaluations */
router.post('/toggleIsReviewed/:id', middlewares.isNat, async (req, res) => {
    const er = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    er.isReviewed = !er.isReviewed;
    await er.save();

    res.json(er);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.lightPurple,
        description: `${er.isReviewed ? 'Reviewed feedback for' : 'Unmarked feedback as reviewed for'} [**${er.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${er.id})`,
    }],
    er.mode);

    Logger.generate(
        req.session.mongoId,
        `Toggled "${er.user.username}" ${er.mode} current BN evaluation isReviewed to ${er.isReviewed}`,
        'bnEvaluation',
        er._id
    );
});

/* POST delete review */
router.post('/deleteReview/:id', middlewares.isAdmin, async (req, res) => {
    const eval = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    const review = eval.reviews.find(r => r._id == req.body.reviewId);

    if (!review) {
        return res.json({ error: 'Review not found' });
    }

    eval.reviews.pull(review);
    await eval.save();
    
    res.json(eval);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted review by **${review.evaluator.username}** in [**${eval.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${eval.id})`,
    }],
    eval.mode);

    Logger.generate(
        req.session.mongoId,
        `Deleted review by "${review.evaluator.username}" in ${eval.mode} current BN eval for "${eval.user.username}"`,
        'bnEvaluation',
        eval._id
    );
});

/* POST select mock evaluators */
router.post('/selectMockEvaluators/:id', middlewares.isNat, async (req, res) => {
    const selectAll = req.body.selectAll;
    const evaluation = await BnEvaluation
        .findById(req.params.id)
        .orFail();

    const selectedUsers = await selectMockEvaluators(evaluation, selectAll);

    // Return selected users without saving to database
    res.json(selectedUsers);

    Logger.generate(
        req.session.mongoId,
        `Generated ${selectedUsers.length} potential mock evaluators for ${evaluation.user.username}'s ${evaluation.mode} BN eval`,
        'bnEvaluation',
        evaluation._id
    );
});

/* POST enable mock evaluators */
router.post('/enableMockEvaluators/:id', middlewares.isNat, async (req, res) => {
    const mockEvaluators = req.body.mockEvaluators || [];
    
    for (let i = 0; i < mockEvaluators.length; i++) {
        const mockEvaluator = mockEvaluators[i];
        const user = await User.findOne({ osuId: mockEvaluator.osuId });
        await BnEvaluation.findByIdAndUpdate(req.params.id, { $push: { mockEvaluators: user._id } });
    }

    let evaluation = await BnEvaluation.findById(req.params.id).populate(defaultPopulate);

    res.json({
        evaluation,
        success: 'Enabled mock evaluations',
    });

    Logger.generate(
        req.session.mongoId,
        `Enabled mock evaluations for ${mockEvaluators.length} BNs on ${evaluation.user.username}'s ${evaluation.mode} BN eval`,
        'bnEvaluation',
        evaluation._id
    );
    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightOrange,
            description: `Enabled mock evaluations for [**${evaluation.user.username}**'s BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
        }],
        evaluation.mode
    );
});

module.exports = { router, getGeneralEvents };
