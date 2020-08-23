const express = require('express');
const Logger = require('../../models/log');
const Report = require('../../models/report');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const ResignationEvaluation = require('../../models/evaluations/resignationEvaluation');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const User = require('../../models/user');
const Aiess = require('../../models/aiess');
const Note = require('../../models/note');
const { submitEval, setGroupEval, setFeedback, replaceUser } = require('./evaluations');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const Evaluation = require('../../models/evaluations/evaluation');
const { EvaluationKind, BnEvaluationConsensus } = require('../../shared/enums');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

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
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups',
        },
    },
];

const notesPopulate = [
    { path: 'author', select: 'username osuId' },
];

/* GET current BN eval listing. */
router.get('/relevantInfo', async (req, res) => {
    const evaluations = await Evaluation.findActiveEvaluations();

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
router.post('/addEvalRounds/', middlewares.isNat, async (req, res) => {
    // TODO missing asigned users in response??
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

    // delete scheduled evalRounds
    for (let i = 0; i < allEvalsToCreate.length; i++) {
        const round = allEvalsToCreate[i];
        await BnEvaluation.deleteUserActiveEvaluations(round.user);
    }

    // create evalRounds or resignations
    const result = isResignation ? await ResignationEvaluation.insertMany(allEvalsToCreate) : await BnEvaluation.insertMany(allEvalsToCreate);

    if (!result.length) return res.json({
        error: `Didn't create any`,
    });

    const evaluations = await Evaluation.findActiveEvaluations();

    res.json({ ers: evaluations, failed });

    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);

    const twoEvaluationModes = ['catch'];
    //const threeEvaluationModes = ['osu', 'taiko', 'mania'];

    if (deadline < minDate) {
        for (let i = 0; i < result.length; i++) {
            const er = result[i];
            const u = await User.findById(er.user);
            const invalids = [8129817, 3178418, 2204515, 2857314, u.osuId];
            const assignedNat = await User.aggregate([
                { $match: { groups: 'nat', 'modesInfo.mode': er.mode, osuId: { $nin: invalids } } },
                { $sample: { size: twoEvaluationModes.includes(er.mode) ? 2 : 3 } },
            ]);
            let natList = '';

            for (let i = 0; i < assignedNat.length; i++) {
                let user = assignedNat[i];
                // const evaluation = await Evaluation.findById(er.id);
                er.natEvaluators.push(user._id);
                await er.save();
                natList += user.username;

                if (i + 1 < assignedNat.length) {
                    natList += ', ';
                }
            }

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
router.post('/submitEval/:id', middlewares.isNat, async (req, res) => {
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
        res.locals.userRequest.isNat,
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
                $in: req.body.checkedRounds,
            },
        })
        .populate(defaultPopulate);

    await setGroupEval(evaluations, req.session);
    evaluations = await Evaluation.findActiveEvaluations();
    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as group evaluation`,
        'bnEvaluation'
    );
});

/* POST set invidivual eval */
router.post('/setIndividualEval/', middlewares.isNat, async (req, res) => {
    await Evaluation.updateMany({
        _id: { $in: req.body.checkedRounds },
    }, {
        discussion: false,
    });

    const evaluations = await Evaluation.findActiveEvaluations();

    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as individual evaluation`,
        'bnEvaluation'
    );
});

/**
 * @param {string} consensus
 * @returns {string}
 */
function getConsensusText (consensus) {
    switch (consensus) {
        case undefined:
            return 'None';
        case 'fullBn':
            return 'Full BN';
        case 'probationBn':
            return 'Probation BN';
        case 'removeFromBn':
            return 'Remove from BN';
        case 'resignedOnGoodTerms':
            return 'Resigned on good terms';
        case 'resignedOnStandardTerms':
            return 'Resigned on standard terms';
        default:
            return consensus.charAt(0).toUpperCase() + consensus.slice(1);
    }
}

/**
 * @param {string} addition
 * @returns {string}
 */
function getAdditionText (addition) {
    switch (addition) {
        case 'lowActivity':
            return 'Low activity warning';
        default:
            return 'None';
    }
}

/* POST set evals as complete */
router.post('/setComplete/', middlewares.isNat, async (req, res) => {
    let evaluations = await Evaluation
        .find({
            _id: {
                $in: req.body.checkedRounds,
            },
            active: true,
        })
        .populate(defaultPopulate);

    for (const evaluation of evaluations) {
        let user = await User.findById(evaluation.user);
        const i = user.modesInfo.findIndex(m => m.mode === evaluation.mode);

        if (evaluation.consensus == BnEvaluationConsensus.RemoveFromBn || evaluation.kind == EvaluationKind.Resignation) {
            if (i !== -1) {
                user.modesInfo.splice(i, 1);
            }

            if (!user.modesInfo.length) {
                const bnIndex = user.groups.findIndex(g => g === 'bn');

                if (bnIndex !== -1) {
                    user.groups.splice(bnIndex, 1);
                }
            }

            user.history.push({
                date: new Date(),
                mode: evaluation.mode,
                kind: 'left',
                group: user.isNat ? 'nat' : 'bn',
                relatedEvaluation: evaluation._id,
            });

            await user.save();
        }

        else if (evaluation.consensus == 'probationBn') {
            if (i !== -1 && user.modesInfo[i].level === 'full') {
                user.modesInfo.splice(i, 1, {
                    mode: evaluation.mode,
                    level: 'probation',
                });
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

        else if (evaluation.consensus == 'fullBn') {
            if (i !== -1 && user.modesInfo[i].level === 'probation') {
                user.modesInfo.splice(i, 1, {
                    mode: evaluation.mode,
                    level: 'full',
                });
            }

            let deadline = new Date();

            if (evaluation.addition == 'lowActivity') {
                deadline.setDate(deadline.getDate() + 40);
            } else {
                deadline.setDate(deadline.getDate() + 100);
            }

            await user.save();
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
            });
        }

        evaluation.active = false;
        evaluation.consensusSetAt = new Date();
        await evaluation.save();

        const consensusText = getConsensusText(evaluation.consensus);
        const additionText = getAdditionText(evaluation.addition);

        Logger.generate(
            req.session.mongoId,
            `Set ${user.username}'s ${evaluation.mode} ${evaluation.kind === EvaluationKind.Resignation ? 'resignation' : 'BN eval'} as "${consensusText}"`,
            'bnEvaluation',
            evaluation._id
        );

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.black,
                description: `Archived [**${user.username}**'s ${evaluation.kind === EvaluationKind.Resignation ? 'resignation' : 'current BN'} eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) with **${consensusText}** consensus and **${additionText}** addition.`,
            }],
            evaluation.mode
        );
    }

    evaluations = await Evaluation.findActiveEvaluations();

    res.json(evaluations);
    Logger.generate(
        req.session.mongoId,
        `Set ${req.body.checkedRounds.length} BN eval${req.body.checkedRounds.length == 1 ? '' : 's'} as completed`,
        'bnEvaluation'
    );
});

/* POST set consensus of eval */
router.post('/setConsensus/:id', middlewares.isNat, async (req, res) => {
    const evaluation = await Evaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation.consensus = req.body.consensus;
    evaluation.addition = 'none';

    if (req.body.consensus == BnEvaluationConsensus.RemoveFromBn || evaluation.kind === EvaluationKind.Resignation) {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        evaluation.cooldownDate = date;
    }

    await evaluation.save();
    res.json(evaluation);

    const consensusText = getConsensusText(evaluation.consensus);

    Logger.generate(
        req.session.mongoId,
        `Set consensus of ${evaluation.user.username}'s ${evaluation.mode} ${evaluation.kind === EvaluationKind.Resignation ? 'resignation' : 'BN eval'} as "${consensusText}"`,
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
router.post('/setAddition/:id', middlewares.isNat, async (req, res) => {
    const evaluation = await BnEvaluation
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    evaluation.addition = req.body.addition;

    await evaluation.save();
    res.json(evaluation);

    const additionText = getAdditionText(evaluation.addition);

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
router.post('/setFeedback/:id', middlewares.isNat, async (req, res) => {
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
            const dateA = (a.kind === EvaluationKind.AppEvaluation ? a.updatedAt : a.deadline);
            const dateB = (b.kind === EvaluationKind.AppEvaluation ? b.updatedAt : b.deadline);
            if (dateA > dateB) return 1;
            if (dateA < dateB) return -1;

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
router.post('/replaceUser/:id', middlewares.isNat, async (req, res) => {
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
        Aiess.find({
            qualityAssuranceCheckers: mongoId,
            timestamp: { $gte: minDate, $lte: maxDate },
        }).populate({
            path: 'qualityAssuranceComments',
            match: { mediator: mongoId },
            populate: {
                path: 'mediator',
                select: 'username osuId',
            },
        }),
    ]);

    const beatmapsetIds = uniqueNominations.map(n => n.beatmapsetId);
    const qaBeatmapsetIds = qualityAssuranceChecks.map(qa => qa.beatmapsetId);
    let [nominationsDisqualified, nominationsPopped, disqualifiedQualityAssuranceChecks, othersNominations] = await Promise.all([
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
            userId: { $ne: userOsuId },
            beatmapsetId: { $in: qaBeatmapsetIds },
            timestamp: { $gte: minDate, $lte: maxDate },
            type: 'disqualify',
        }).populate({
            path: 'qualityAssuranceComments',
            match: { mediator: mongoId },
            populate: {
                path: 'mediator',
                select: 'username osuId',
            },
        }),
        Aiess.find({
            userId: { $ne: userOsuId },
            beatmapsetId: { $in: beatmapsetIds },
            timestamp: { $gte: minDate, $lte: maxDate },
            type: { $in: ['nominate', 'qualify'] },
        }),
    ]);

    // Exclude pops/dqs that happened before this user nomination
    // And pops/dqs that happened after others bns nominated the set (and current bn wasn't involved in the end)
    nominationsPopped = nominationsPopped.filter(pop => {
        const happenedBefore = uniqueNominations.some(n => n.beatmapsetId == pop.beatmapsetId && n.timestamp < pop.timestamp);
        const nominationsAfterwards = othersNominations.filter(n => n.beatmapsetId == pop.beatmapsetId && n.timestamp < pop.timestamp);

        return !nominationsAfterwards.length && happenedBefore;
    });
    nominationsDisqualified = nominationsDisqualified.filter(dq => {
        const happenedBefore = uniqueNominations.some(n => n.beatmapsetId == dq.beatmapsetId && n.timestamp < dq.timestamp);
        const nominationsAfterwards = othersNominations.filter(n => n.beatmapsetId == dq.beatmapsetId && n.timestamp < dq.timestamp);

        return nominationsAfterwards.length < 2 && happenedBefore;
    });
    disqualifiedQualityAssuranceChecks = disqualifiedQualityAssuranceChecks.filter(dq =>
        qualityAssuranceChecks.some(qa => qa.beatmapsetId == dq.beatmapsetId && qa.timestamp < dq.timestamp)
    );

    for (let i = 0; i < disqualifiedQualityAssuranceChecks.length; i++) {
        const event = disqualifiedQualityAssuranceChecks[i];

        const related = qualityAssuranceChecks.find(qa => qa.beatmapsetId == event.beatmapsetId && qa.timestamp < event.timestamp);

        if (related && related.qualityAssuranceComments.length) {
            disqualifiedQualityAssuranceChecks[i].qualityAssuranceComments = related.qualityAssuranceComments.filter(c => c.mediator.id == mongoId);
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
    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');
    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - 90);
    let maxDate = new Date(deadline);

    // find all assigned applications for BN
    const assignedBnApplications = await AppEvaluation
        .find({
            bnEvaluators: mongoId,
            mode: modes,
            createdAt: { $gte: minDate },
        })
        .populate(applicationPopulate)
        .sort({ createdAt: 1 });

    // find all applications & evalRounds for NAT
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
    appEvaluations = appEvaluations.filter(a =>
        a.reviews.some(r => r.evaluator.id == mongoId || a.natEvaluators.includes(mongoId))
    );

    // extract evalRounds that user evaluated or was assigned to
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

module.exports = { router, getGeneralEvents };
