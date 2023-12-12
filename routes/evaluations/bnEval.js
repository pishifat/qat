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
const { submitEval, setGroupEval, setFeedback, replaceUser, findSkipProbationEligibility } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const { BnEvaluationConsensus, BnEvaluationAddition, ResignationConsensus } = require('../../shared/enums');
const osuBot = require('../../helpers/osuBot');
const Settings = require('../../models/settings');
const { makeWordFromField } = require('../../helpers/scrap');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNatOrTrialNat);

//population
const defaultPopulate = [
    {
        path: 'user',
        select: 'username osuId modesInfo groups evaluatorModes',
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
];

const notesPopulate = [
    { path: 'author', select: 'username osuId' },
];

/* GET current BN eval listing. */
router.get('/relevantInfo', async (req, res) => {
    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat);

    res.json({
        evaluations,
    });
});

function isValidMode(modeToCheck, isOsu, isTaiko, isCatch, isMania) {
    return ((modeToCheck == 'osu' && isOsu) ||
        (modeToCheck == 'taiko' && isTaiko) ||
        (modeToCheck == 'catch' && isCatch) ||
        (modeToCheck == 'mania' && isMania));
}

/* POST submit or edit eval */
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

    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat);

    res.json({
        evaluations,
        failed,
        success: 'Generated evaluations',
    });

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
            const days = util.findDaysBetweenDates(new Date(), new Date(deadline));

            for (const user of assignedNat) {
                assignments.push({
                    date: new Date(),
                    user: user._id,
                    daysOverdue: days,
                });
            }
        
            er.natEvaluatorHistory = assignments;

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

    Logger.generate(
        req.session.mongoId,
        `Added BN evaluations for ${allEvalsToCreate.length} user${allEvalsToCreate.length == 1 ? '' : 's'}`,
        'bnEvaluation'
    );
});

/* POST submit or edit eval */
router.post('/submitEval/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    let evaluation = await Evaluation
        .findOne({
            _id: req.params.id,
            active: true,
        })
        .populate(defaultPopulate)
        .orFail();

    const isNewEvaluation = await submitEval(
        evaluation,
        req.session,
        res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat,
        req.body.behaviorComment,
        req.body.moddingComment,
        req.body.vote,
    );

    evaluation = await Evaluation.findById(req.params.id).populate(defaultPopulate);
    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `${isNewEvaluation ? 'Submitted' : 'Updated'} ${evaluation.mode} BN evaluation for "${evaluation.user.username}"`,
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
    evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat);
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

    const evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat);

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

                await user.save();

                evaluation.consensus = BnEvaluationConsensus.RemoveFromNat;
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

            if (evaluation.overwriteNextEvaluationDate) {
                deadline = new Date(evaluation.overwriteNextEvaluationDate); // manually set deadline
                const today = new Date();
                const difference = deadline.getTime() - today.getTime();
                activityToCheck = Math.ceil(difference / (1000*3600*24)); // days between deadline and now
            }
            
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

            if (evaluation.overwriteNextEvaluationDate) {
                deadline = new Date(evaluation.overwriteNextEvaluationDate); // manually set deadline
                const today = new Date();
                const difference = deadline.getTime() - today.getTime();
                activityToCheck = Math.ceil(difference / (1000*3600*24)); // days between deadline and now
            } else if (evaluation.addition === BnEvaluationAddition.LowActivityWarning) {
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
            const consensusText = makeWordFromField(evaluation.consensus);
            const additionText = makeWordFromField(evaluation.addition);

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

        
    }

    evaluations = await Evaluation.findActiveEvaluations(res.locals.userRequest, res.locals.userRequest.isNat);

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
    evaluation.overwriteNextEvaluationDate = null;

    if (req.body.consensus === BnEvaluationConsensus.RemoveFromBn || evaluation.isResignation) {
        const date = new Date();

        if (req.body.consensus != ResignationConsensus.ResignedOnGoodTerms && (req.body.consensus == BnEvaluationConsensus.RemoveFromBn && evaluation.addition != BnEvaluationAddition.LowActivityWarning)) {
            date.setDate(date.getDate() + 60);
        }

        evaluation.cooldownDate = date;
    }

    await evaluation.save();
    res.json(evaluation);

    const consensusText = makeWordFromField(evaluation.consensus);

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
    evaluation.overwriteNextEvaluationDate = null;

    if (req.body.addition == BnEvaluationAddition.LowActivityWarning) {
        const date = new Date();
        date.setDate(date.getDate() + 30);

        evaluation.cooldownDate = date;
    }

    await evaluation.save();
    res.json(evaluation);

    const additionText = makeWordFromField(evaluation.addition);

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

/* POST set cooldown */
router.post('/setCooldown/:id', middlewares.isNatOrTrialNat, async (req, res) => {
    const hasCooldown = req.body.hasCooldown;

    const evaluation = await BnEvaluation
        .findByIdAndUpdate(req.params.id, {
            hasCooldown,
        })
        .populate(defaultPopulate);

    const defaultCooldownDate = moment(evaluation.deadline).add(60, 'days').toDate();
    const reducedCooldownDate = moment(evaluation.deadline).add(30, 'days').toDate();

    evaluation.cooldownDate = hasCooldown ? reducedCooldownDate : defaultCooldownDate;
    await evaluation.save();

    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `Set cooldown to "${hasCooldown ? 'reduced' : 'none'}" (${evaluation.cooldownDate.toISOString().slice(0,10)}) for ${evaluation.user.username}'s ${evaluation.mode} current BN evaluation`,
        'bnEvaluation',
        evaluation._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkBlue,
            description: `Set re-apply cooldown to **"${hasCooldown ? 'reduced' : 'none'}" (${evaluation.cooldownDate.toISOString().slice(0,10)})** for [**${evaluation.user.username}**'s current BN evaluation](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
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
router.get('/findPreviousEvaluations/:userId', async (req, res) => {
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
            if (dateA > dateB) return 1;
            if (dateA < dateB) return -1;

            return 0;
        });
    }

    res.json({ previousEvaluations });
});

/* GET skip probation eligibility */
router.get('/findSkipProbationEligibility/:userId/:mode', async (req, res) => {
    const skipProbation = await findSkipProbationEligibility(req.params.userId, req.params.mode);

    res.json(skipProbation);
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

    let newEvaluator = await replaceUser(evaluation, res.locals.userRequest, req.body.evaluatorId, !replaceNat, req.body.selectedUserId);

    if (replaceNat) {
        const days = util.findDaysBetweenDates(new Date(), new Date(evaluation.deadline));

        evaluation.natEvaluatorHistory.push({
            date: new Date(),
            user: newEvaluator._id,
            previousUser: req.body.evaluatorId,
            daysOverdue: days,
        });

        await evaluation.save();
    }

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

    const [uniqueNominations, disqualifications, pops, qualityAssuranceChecks] = await Promise.all([
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
    ]);

    const beatmapsetIds = uniqueNominations.map(n => n.beatmapsetId);
    const qaBeatmapsetIds = qualityAssuranceChecks.map(qa => qa.event.beatmapsetId);

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

    return {
        uniqueNominations,
        nominationsDisqualified,
        nominationsPopped,
        disqualifications,
        pops,
        qualityAssuranceChecks,
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
        select: 'evaluator behaviorComment moddingComment vote createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
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

    // find all assigned applications for BN
    const assignedBnApplications = await AppEvaluation
        .find({
            bnEvaluators: mongoId,
            mode: modes,
            createdAt: { $gt: minDate },
            discussion: true,
        })
        .populate(applicationPopulate)
        .sort({ createdAt: 1 });

    // find all AppEvaluations & BnEvaluations/Resignations for NAT
    let [appEvaluations, bnEvaluations] = await Promise.all([
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
    ]);

    // extract apps that user evaluated or was assigned to
    appEvaluations = appEvaluations.filter(a =>
        a.reviews.some(r => r.evaluator.id == mongoId || a.natEvaluators.includes(mongoId))
    );

    // extract BnEvaluations/Resignations that user evaluated or was assigned to
    bnEvaluations = bnEvaluations.filter(e =>
        e.reviews.some(r => r.evaluator.id == mongoId || e.natEvaluators.includes(mongoId))
    );

    res.json({
        ...await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate),
        assignedBnApplications,
        appEvaluations,
        bnEvaluations,
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

    const channel = {
        name: `BN Eval Results (${evaluation.mode == 'osu' ? 'osu!' : `osu!${evaluation.mode}`})`,
        description: `Results for your recent BN evaluation (${moment(evaluation.createdAt).format('YYYY-MM-DD')})`,
    }

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: `Messages were not sent. Please let pishifat know!` });
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

/* POST overwrite next evaluation deadline */
router.post('/overwriteEvaluationDate/:id/', middlewares.isNat, async (req, res) => {
    const er = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate);

    const newDeadline = new Date(req.body.newDeadline);
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    if (newDeadline < twoWeeks) {
        return res.json({
            error: 'New deadline is too soon.'
        });
    }

    er.overwriteNextEvaluationDate = newDeadline;
    await er.save();

    res.json(er);

    Logger.generate(
        req.session.mongoId,
        `Overwrote "${er.user.username}" ${er.mode} next current BN evaluation deadline to ${newDeadline.toISOString().slice(0,10)}`,
        'bnEvaluation',
        er._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkBlue,
            description: `**${er.user.username}**'s next BN evaluation date set to **${newDeadline.toISOString().slice(0,10)}**`,
        }],
        er.mode
    );
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

module.exports = { router, getGeneralEvents };
