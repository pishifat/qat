const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Penalty = require('../models/penalty');
const User = require('../models/user');
const Aiess = require('../models/aiess');
const { isNatEvaluation } = require('../shared/isNatEvaluation');
const { scoreBnRisk } = require('../shared/bnRiskEngine');
const { WARNING_ADDITIONS, DQ_MAX_AGE_MONTHS, CACHE_MAX_AGE_MS, GAMEPLAY_MODES } = require('../shared/bnRiskConfig');
const { getAttributedNominationResets } = require('../helpers/nominationResetsAttribution');
const { stripRiskFields } = require('../helpers/stripRiskFields');

const MONTH_MS = 1000 * 60 * 60 * 24 * 30.4375;

function isGameplayMode(mode) {
    return GAMEPLAY_MODES.includes(mode);
}

function cacheEntry(result, mode) {
    return {
        mode,
        score: result.score,
        level: result.level,
        limitedHistory: result.limitedHistory,
        calculatedAt: result.calculatedAt ? new Date(result.calculatedAt) : new Date(),
    };
}

async function writeUserCache(userId, mode, result) {
    const user = await User.findById(userId).select('+evaluationRiskCache');

    if (!user) return;

    const cache = Array.isArray(user.evaluationRiskCache) ? [...user.evaluationRiskCache] : [];
    const index = cache.findIndex(entry => entry.mode === mode);
    const entry = cacheEntry(result, mode);

    if (index === -1) cache.push(entry);
    else cache[index] = entry;

    user.evaluationRiskCache = cache;
    await user.save();
}

/**
 * @param {string} userId
 * @param {string} mode
 * @returns {Promise<object>}
 */
async function calculateBnRisk(userId, mode) {
    if (!isGameplayMode(mode)) {
        return { error: 'Invalid mode' };
    }

    const user = await User.findById(userId).orFail();
    const now = new Date();
    const minDate = new Date(now.getTime() - DQ_MAX_AGE_MONTHS * MONTH_MS);

    const evaluations = await BnEvaluation
        .find({
            user: userId,
            mode,
            active: false,
            consensus: { $exists: true },
        })
        .populate('user', 'username osuId modesInfo groups')
        .sort({ archivedAt: -1, createdAt: -1 });

    const bnEvaluations = evaluations.filter(evaluation => !isNatEvaluation(evaluation));

    const [penalties, resets] = await Promise.all([
        Penalty.find({ user: userId, mode }).sort({ createdAt: -1 }),
        getAttributedNominationResets(user.osuId, [mode], minDate, now),
    ]);

    const dqEvents = [
        ...(resets.nominationsDisqualified || []),
        ...(resets.nominationsPopped || []),
    ];

    const result = scoreBnRisk({
        evaluations: bnEvaluations,
        dqEvents,
        penalties,
        now,
    });

    await writeUserCache(userId, mode, result);

    return result;
}

function getCachedRisk(user, mode) {
    const cache = user && user.evaluationRiskCache;
    if (!cache || !cache.length) return null;

    const entry = cache.find(item => item.mode === mode);
    if (!entry || !entry.calculatedAt) return null;

    if (Date.now() - new Date(entry.calculatedAt).getTime() > CACHE_MAX_AGE_MS) {
        return null;
    }

    return entry;
}

/**
 * @param {string} userId
 * @param {string} mode
 * @returns {Promise<{ score: number, level: string, limitedHistory: boolean }|null>}
 */
async function getOrCalculateBadge(userId, mode) {
    const user = await User.findById(userId).select('+evaluationRiskCache');
    const cached = getCachedRisk(user, mode);

    if (cached) {
        return {
            score: cached.score,
            level: cached.level,
            limitedHistory: cached.limitedHistory,
        };
    }

    const result = await calculateBnRisk(userId, mode);

    if (result.error) return null;

    return {
        score: result.score,
        level: result.level,
        limitedHistory: result.limitedHistory,
    };
}

async function calculateBnRiskForUserModes(userId, modes) {
    const gameplayModes = (modes || []).filter(isGameplayMode);
    const results = [];

    for (const mode of gameplayModes) {
        results.push(await calculateBnRisk(userId, mode));
    }

    return results;
}

async function listWarningEvaluations(userId, mode, limit = 15) {
    const evaluations = await BnEvaluation
        .find({
            user: userId,
            mode,
            active: false,
            consensus: { $exists: true },
            addition: { $in: [...WARNING_ADDITIONS] },
        })
        .populate('user', 'username osuId modesInfo groups')
        .sort({ archivedAt: -1, createdAt: -1 })
        .limit(limit);

    return evaluations.filter(evaluation => !isNatEvaluation(evaluation));
}

async function attachRiskBadges(evaluations, viewer) {
    if (!viewer || !viewer.isNatOrTrialNat) {
        return evaluations.map((evaluation) => {
            const obj = evaluation && evaluation.toObject ? evaluation.toObject() : evaluation;

            return stripRiskFields(obj);
        });
    }

    return Promise.all(evaluations.map(async (evaluation) => {
        const obj = evaluation && evaluation.toObject ? evaluation.toObject() : { ...evaluation };
        const skip = obj.isApplication || isNatEvaluation(evaluation) || !isGameplayMode(obj.mode);
        const user = evaluation.user || obj.user;
        const userId = user && (user.id || user._id);

        if (!skip && userId) {
            try {
                const badge = await getOrCalculateBadge(userId, obj.mode);

                if (badge) {
                    obj.riskLevel = badge.level;
                    obj.riskScore = badge.score;
                    obj.limitedHistory = badge.limitedHistory;
                }
            } catch (error) {
                // listing still succeeds if a single risk calc fails
            }
        }

        return obj;
    }));
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
                await calculateBnRisk(user.id, mode);
            }
        }
    }
}

module.exports = {
    calculateBnRisk,
    getOrCalculateBadge,
    getCachedRisk,
    calculateBnRiskForUserModes,
    listWarningEvaluations,
    attachRiskBadges,
    recalcForAiessEvent,
    isGameplayMode,
};
