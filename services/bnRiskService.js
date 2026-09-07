const Evaluation = require('../models/evaluations/evaluation');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Penalty = require('../models/penalty');
const User = require('../models/user');
const Aiess = require('../models/aiess');
const { isNatEvaluation } = require('../shared/isNatEvaluation');
const { scoreBnRisk } = require('../shared/bnRiskEngine');
const { GAMEPLAY_MODES } = require('../shared/bnRiskConfig');
const { getAttributedNominationResets } = require('../helpers/nominationResetsAttribution');
const { stripRiskFields } = require('../helpers/stripRiskFields');

function isGameplayMode(mode) {
    return GAMEPLAY_MODES.includes(mode);
}

/** Same lookback as UserActivity: deadline − (activityToCheck + 7), default 90 + 7. */
function evalActivityWindow(evaluation = {}) {
    const maxDate = evaluation.deadline ? new Date(evaluation.deadline) : new Date();
    const days = evaluation.activityToCheck ? evaluation.activityToCheck + 7 : 90 + 7;
    const minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - days);

    return { minDate, maxDate };
}

function decorateRiskFields(obj) {
    const snapshot = obj && obj.riskSnapshot;

    if (snapshot && snapshot.level) {
        obj.riskLevel = snapshot.level;
        obj.riskScore = snapshot.score;
        obj.limitedHistory = snapshot.limitedHistory;
    }

    return obj;
}

function riskWebhookFields(result) {
    if (!result || result.error || !result.level) return [];

    const formattedLevel = result.level.charAt(0) + result.level.slice(1).toLowerCase();

    return [{
        name: 'Evaluation risk',
        value: `**${formattedLevel}** (${result.score}/100)${result.limitedHistory ? ' (limited history)' : ''}`,
    }];
}

function hasStoredRisk(evaluation) {
    return Boolean(evaluation && evaluation.riskSnapshot && evaluation.riskSnapshot.level);
}

function shouldCalculateEvalRisk(evaluation) {
    if (!evaluation || evaluation.isApplication) return false;
    if (!isGameplayMode(evaluation.mode)) return false;
    if (isNatEvaluation(evaluation)) return false;

    return true;
}

/**
 * @param {string} userId
 * @param {string} mode
 * @returns {Promise<object>}
 */
async function calculateBnRisk(userId, mode, options = {}) {
    if (!isGameplayMode(mode)) {
        return { error: 'Invalid mode' };
    }

    const user = await User.findById(userId).orFail();
    const now = new Date();
    const { minDate, maxDate } = evalActivityWindow(options);

    const query = {
        user: userId,
        mode,
        active: false,
        consensus: { $exists: true },
    };

    if (options.excludeEvalId) {
        query._id = { $ne: options.excludeEvalId };
    }

    const evaluations = await BnEvaluation
        .find(query)
        .populate('user', 'username osuId modesInfo groups')
        .sort({ archivedAt: -1, createdAt: -1 });

    const bnEvaluations = evaluations.filter(evaluation => !isNatEvaluation(evaluation));

    const [penalties, resets] = await Promise.all([
        Penalty.find({ user: userId, mode }).sort({ createdAt: -1 }),
        getAttributedNominationResets(user.osuId, [mode], minDate, maxDate),
    ]);

    const dqEvents = [
        ...(resets.nominationsDisqualified || []),
        ...(resets.nominationsPopped || []),
    ];

    return scoreBnRisk({
        evaluations: bnEvaluations,
        dqEvents,
        penalties,
        nominations: resets.uniqueNominations || [],
        mode,
        now,
    });
}

async function storeOnActiveBnEval(userId, mode, result) {
    if (!result || result.error) return;

    await Evaluation.updateMany(
        {
            user: userId,
            mode,
            active: true,
            kind: { $in: ['currentBn', 'resignation'] },
        },
        { $set: { riskSnapshot: result } }
    );
}

async function recalculateActiveBnEval(userId, mode) {
    const evaluations = await Evaluation.find({
        user: userId,
        mode,
        active: true,
        kind: { $in: ['currentBn', 'resignation'] },
    });

    let result = null;

    for (const evaluation of evaluations) {
        result = await calculateAndStoreForEvaluation(evaluation);
    }

    return result || calculateBnRisk(userId, mode);
}

async function calculateAndStoreForEvaluation(evaluation) {
    if (!evaluation || !evaluation.active) {
        return { error: 'Archived evaluations keep their original risk snapshot' };
    }

    const result = await calculateBnRisk(evaluation.user, evaluation.mode, {
        excludeEvalId: evaluation._id || evaluation.id,
        deadline: evaluation.deadline,
        activityToCheck: evaluation.activityToCheck,
    });

    if (result.error) return result;

    evaluation.riskSnapshot = result;

    if (typeof evaluation.markModified === 'function') {
        evaluation.markModified('riskSnapshot');
    }

    if (typeof evaluation.save === 'function') {
        await evaluation.save();
    }

    return result;
}

function attachRiskBadges(evaluations, viewer) {
    if (!viewer || !viewer.isNatOrTrialNat) {
        return evaluations.map((evaluation) => {
            const obj = evaluation && evaluation.toObject ? evaluation.toObject() : evaluation;

            return stripRiskFields(obj);
        });
    }

    return evaluations.map((evaluation) => {
        const obj = evaluation && evaluation.toObject ? evaluation.toObject() : { ...evaluation };

        return decorateRiskFields(obj);
    });
}

async function recalcForAiessEvent(event) {
    if (!event || !event.beatmapsetId || !event.timestamp) return;

    const prior = await Aiess
        .find({
            beatmapsetId: event.beatmapsetId,
            timestamp: { $lt: event.timestamp },
            type: { $in: ['nominate', 'qualify'] },
        })
        .sort({ timestamp: -1 })
        .limit(2);

    const osuIds = [...new Set(prior.map(item => item.userId).filter(Boolean))];

    if (!osuIds.length) return;

    const users = await User.find({ osuId: { $in: osuIds } });
    const modes = (event.modes && event.modes.length) ? event.modes : GAMEPLAY_MODES;

    for (const user of users) {
        for (const mode of modes) {
            if (isGameplayMode(mode)) {
                await recalculateActiveBnEval(user.id, mode);
            }
        }
    }
}

async function refreshAllActiveEvaluations() {
    const evaluations = await Evaluation.find({
        active: true,
        kind: { $in: ['currentBn', 'resignation'] },
    }).populate('user', 'username osuId modesInfo groups evaluatorModes');

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    console.log(`[risk] refreshing ${evaluations.length} active BN evals`);

    for (const evaluation of evaluations) {
        if (!shouldCalculateEvalRisk(evaluation)) {
            skipped += 1;
            console.log(`[risk] skipped ${evaluation.user.username} ${evaluation.mode} ${evaluation.kind}`);
            continue;
        }

        try {
            const result = await calculateAndStoreForEvaluation(evaluation);

            if (result && result.error) {
                failed += 1;
                console.log(`[risk] failed ${evaluation.user.username} ${evaluation.mode} ${evaluation.kind}: ${result.error}`);
            } else {
                updated += 1;
                const username = evaluation.user && evaluation.user.username
                    ? evaluation.user.username
                    : evaluation.user;

                console.log(
                    `[risk] updated ${username} ${evaluation.mode} ${evaluation.kind}: ${result.level} ${result.score}/100`
                );
            }
        } catch (error) {
            failed += 1;
            console.log(`[risk] failed ${evaluation.user.username} ${evaluation.mode} ${evaluation.kind}: ${error}`);
        }
    }

    return {
        updated,
        skipped,
        failed,
        total: evaluations.length,
    };
}

module.exports = {
    calculateBnRisk,
    calculateAndStoreForEvaluation,
    storeOnActiveBnEval,
    recalculateActiveBnEval,
    refreshAllActiveEvaluations,
    riskWebhookFields,
    hasStoredRisk,
    shouldCalculateEvalRisk,
    attachRiskBadges,
    recalcForAiessEvent,
    isGameplayMode,
};
