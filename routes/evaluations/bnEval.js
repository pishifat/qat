const express = require('express');
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
const { submitEval, setGroupEval, setFeedback, replaceUser, findEvaluationsWithoutIncident } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const { BnEvaluationConsensus, BnEvaluationAddition, ResignationConsensus } = require('../../shared/enums');
const osuBot = require('../../helpers/osuBot');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccessOrTrialNat);

//population
const defaultPopulate = [
    {
        path: 'user',
        select: 'username osuId modesInfo groups',
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
        select: 'evaluator behaviorComment moddingComment vote',
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
    const evaluations = await Evaluation.findActiveEvaluations(req.session.mongoId);

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
        await Evaluation.deleteUserActiveEvaluations(round.user);
    }

    // create BnEvaluations or Resignations
    const result = isResignation ? await ResignationEvaluation.insertMany(allEvalsToCreate) : await BnEvaluation.insertMany(allEvalsToCreate);

    if (!result.length) return res.json({
        error: `Didn't create any`,
    });

    const evaluations = await Evaluation.findActiveEvaluations(req.session.mongoId);

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
            const assignedNat = await User.getAssignedNat(er.mode, [u.osuId]);
            er.natEvaluators = assignedNat;
            await er.populate(defaultPopulate).execPopulate();
            await er.save();
            const natList = assignedNat.map(u => u.username).join(', ');

            await discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.white,
                    description: `Created [**${u.username}**'s ${isResignation ? 'resignation' : 'current BN'} eval](http://bn.mappersguild.com/bneval?id=${er.id})`,
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

    if (res.locals.userRequest.isTrialNat) {
        const bnEvaluatorIds = evaluation.bnEvaluators.map(u => u.id);

        let minDate = new Date(evaluation.deadline);
        minDate.setDate(minDate.getDate() - 3);

        if (!bnEvaluatorIds.includes(res.locals.userRequest.id) && new Date() < minDate) {
            return res.json({ error: `Let one of the assigned BNs evaluate first. You can submit your evaluation after ${minDate}` });
        }
    }


    const isNewEvaluation = await submitEval(
        evaluation,
        req.session,
        res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat,
        req.body.behaviorComment,
        req.body.moddingComment,
        req.body.vote
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
    evaluations = await Evaluation.findActiveEvaluations(req.session.mongoId);
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

    const evaluations = await Evaluation.findActiveEvaluations(req.session.mongoId);

    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.evalIds.length} BN eval${req.body.evalIds.length == 1 ? '' : 's'} as individual evaluation`,
        'bnEvaluation'
    );
});

/**
 * @param {string} field
 * @returns {string}
 */
function makeWordFromField (field) {
    if (!field) return 'none';

    // Bn --> BN
    let word = field.replace(/Bn/,'BN');
    // aWordWithBNOnIt --> a Word With BNOn It
    word = word.replace(/([a-z])([A-Z])/g, '$1 $2');
    // a Word With BNOn It --> a Word With BN On It
    word = word.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    // capitalize
    word = word.charAt(0).toUpperCase() + word.slice(1);

    return word;
}

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNat, async (req, res) => {
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

        if (evaluation.consensus === BnEvaluationConsensus.RemoveFromBn || (evaluation.isResignation && evaluation.consensus)) {
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

            let deadline = new Date();
            deadline.setDate(deadline.getDate() + 40);
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck: 40,
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
                deadline.setDate(deadline.getDate() + 40); // +40 days
            } else {
                const random90 = Math.round(Math.random() * (95 - 85) + 85); // between 85 and 95 days
                const random180 = Math.round(Math.random() * (185 - 175) + 175); // between 185 and 175 days

                const evaluationsWithoutIncident = await findEvaluationsWithoutIncident(user._id);

                if (evaluationsWithoutIncident > 1) {
                    deadline.setDate(deadline.getDate() + random180);
                    activityToCheck = random180;
                } else {
                    deadline.setDate(deadline.getDate() + random90);
                    activityToCheck = random90;
                }
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

        const consensusText = makeWordFromField(evaluation.consensus);
        const additionText = makeWordFromField(evaluation.addition);

        Logger.generate(
            req.session.mongoId,
            `Set ${user.username}'s ${evaluation.mode} ${evaluation.isResignation ? 'resignation' : 'BN eval'} as "${consensusText}"`,
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

    evaluations = await Evaluation.findActiveEvaluations(req.session.mongoId);

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

        if (req.body.consensus == ResignationConsensus.ResignedOnGoodTerms || (req.body.consensus == BnEvaluationConsensus.RemoveFromBn && evaluation.addition == BnEvaluationAddition.LowActivityWarning)) {
            date.setDate(date.getDate() + 30);
        } else {
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
router.post('/setCooldownDate/:id', middlewares.isNat, async (req, res) => {
    let evaluation = await BnEvaluation
        .findByIdAndUpdate(req.params.id, { cooldownDate: req.body.cooldownDate })
        .populate(defaultPopulate);

    res.json(evaluation);
    Logger.generate(
        req.session.mongoId,
        `Changed cooldown date to ${req.body.cooldownDate.toString().slice(0,10)} for ${evaluation.user.username}'s ${evaluation.mode} current BN evaluation`,
        'bnEvaluation',
        evaluation._id
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

/* GET estimated next evaluation date */
router.get('/findEvaluationsWithoutIncident/:userId', async (req, res) => {
    const evaluationsWithoutIncident = await findEvaluationsWithoutIncident(req.params.userId);

    res.json(evaluationsWithoutIncident);
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
        QualityAssuranceCheck.find({
            user: mongoId,
            timestamp: { $gte: minDate, $lte: maxDate },
        }).populate({
            path: 'event',
            select: 'beatmapsetId timestamp modes artistTitle creatorName creatorId',
        }),
    ]);

    const beatmapsetIds = uniqueNominations.map(n => n.beatmapsetId);
    const qaBeatmapsetIds = qualityAssuranceChecks.map(qa => qa.event.beatmapsetId);

    let [allNominationsDisqualified, allNominationsPopped, disqualifiedQualityAssuranceChecks/*, othersNominations*/] = await Promise.all([
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
            timestamp: { $gte: minDate, $lte: maxDate },
            type: 'disqualify',
        }),
        /*Aiess.find({
            userId: { $ne: userOsuId },
            beatmapsetId: { $in: beatmapsetIds },
            timestamp: { $gte: minDate, $lte: maxDate },
            type: { $in: ['nominate', 'qualify'] },
        }),*/
    ]);

    // Exclude pops/dqs that happened before this user nomination
    // And pops/dqs that happened after others bns nominated the set (and current bn wasn't involved in the end)

    /* the "efficient" but broken way
    nominationsPopped = nominationsPopped.filter(pop => {
        const happenedBefore = uniqueNominations.some(n => n.beatmapsetId == pop.beatmapsetId && n.timestamp < pop.timestamp);
        const nominationsAfterwards = othersNominations.filter(n => n.beatmapsetId == pop.beatmapsetId && n.timestamp < pop.timestamp);

        return !nominationsAfterwards.length && happenedBefore;
    }
    */

    // the inefficient but working (?) way
    let nominationsPopped = [];

    for (const event of allNominationsPopped) {
        if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
            let a = await Aiess
                .find({
                    beatmapsetId: event.beatmapsetId,
                    timestamp: { $lte: event.timestamp },
                })
                .sort({ timestamp: -1 })
                .limit(2);

            if (a[1] && a[1].userId == userOsuId) {
                nominationsPopped.push(event);
            }
        }
    }

    /* the "efficient" but broken way
    nominationsDisqualified = nominationsDisqualified.filter(dq => {
        const happenedBefore = uniqueNominations.some(n => n.beatmapsetId == dq.beatmapsetId && n.timestamp < dq.timestamp);
        const nominationsAfterwards = othersNominations.filter(n => n.beatmapsetId == dq.beatmapsetId && n.timestamp < dq.timestamp);

        return nominationsAfterwards.length < 2 && happenedBefore;
    */

    // the inefficient but working (?) way
    let nominationsDisqualified = [];

    for (const event of allNominationsDisqualified) {
        if (uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
            let a = await Aiess
                .find({
                    beatmapsetId: event.beatmapsetId,
                    timestamp: { $lte: event.timestamp },
                })
                .sort({ timestamp: -1 })
                .limit(3);

            if ((a[1] && a[1].userId == userOsuId) || (a[2] && a[2].userId == userOsuId)) {
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
        select: 'evaluator behaviorComment moddingComment vote',
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
    else if (days > 1000) days = 999;
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
            createdAt: { $gte: minDate },
            discussion: true,
        })
        .populate(applicationPopulate)
        .sort({ createdAt: 1 });

    // find all AppEvaluations & BnEvaluations/Resignations for NAT
    let [appEvaluations, bnEvaluations] = await Promise.all([
        AppEvaluation
            .find({
                createdAt: { $gte: minDate },
                mode: { $in: modes },
                active: false,
                bnEvaluators: { $ne: mongoId },
            })
            .populate(applicationPopulate)
            .sort({ createdAt: 1 }),

        Evaluation
            .find({
                deadline: { $gte: minDate },
                mode: { $in: modes },
                active: false,
            })
            .populate(defaultPopulate)
            .sort({ createdAt: 1 }),
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

    let messages;

    req.body.users.push({ osuId: req.session.osuId });

    for (const user of req.body.users) {
        messages = await osuBot.sendMessages(user.osuId, req.body.messages);
    }

    if (messages !== true) {
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

module.exports = { router, getGeneralEvents };
