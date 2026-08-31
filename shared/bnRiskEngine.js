'use strict';

const config = require('./bnRiskConfig');

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function ageInMonths(date, now) {
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const n = now instanceof Date ? now.getTime() : new Date(now).getTime();

    return (n - t) / MS_PER_MONTH;
}

function recencyWeight(ageMonths) {
    if (ageMonths < 0) return 1;
    if (ageMonths > config.DQ_MAX_AGE_MONTHS) return 0;

    return Math.pow(2, -ageMonths / config.RISK_HALF_LIFE_MONTHS);
}

function isQualityBehaviorWarning(addition) {
    return config.WARNING_ADDITIONS.includes(addition);
}

function getSevBase(obviousness, severity) {
    if (obviousness === null || obviousness === undefined || severity === null || severity === undefined) {
        return 0;
    }

    const key = `${obviousness}/${severity}`;

    return config.SEV_WEIGHTS[key] ?? 0;
}

function classifyLevel(score) {
    if (score <= config.RISK_LOW_MAX) return config.RISK_LEVEL.Low;
    if (score <= config.RISK_MEDIUM_MAX) return config.RISK_LEVEL.Medium;

    return config.RISK_LEVEL.High;
}

function idOf(doc) {
    if (!doc) return null;
    if (doc.id) return String(doc.id);
    if (doc._id) return String(doc._id);

    return null;
}

function additionLabel(addition) {
    switch (addition) {
        case 'mapQualityWarning': return 'mapping-quality warning';
        case 'moddingQualityWarning': return 'modding-quality warning';
        case 'behaviorWarning': return 'behavior warning';
        default: return addition || 'evaluation';
    }
}

function penaltyTypeLabel(type) {
    switch (type) {
        case 'mappingQuality': return 'mapping-quality';
        case 'moddingQuality': return 'modding-quality';
        case 'behavior': return 'behaviour';
        default: return type || 'other';
    }
}

function penaltySeverityLabel(severity) {
    if (!severity) return '';

    return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * Pure scoring. All inputs are plain objects; no Mongo access.
 *
 * @param {object} input
 * @param {Array} input.evaluations archived currentBn evals in this mode, newest first, NAT evals already excluded
 * @param {Array} input.dqEvents attributed DQs and pops ({ _id/id, timestamp, obviousness, severity, type, artistTitle })
 * @param {Array} input.penalties this mode's penalties
 * @param {Date} [input.now]
 * @returns {object}
 */
function scoreBnRisk({ evaluations = [], dqEvents = [], penalties = [], now = new Date() } = {}) {
    const limitedHistory = evaluations.length === 0;

    let E = 0;
    const evalContributors = [];
    const lastThree = evaluations.slice(0, 3);

    lastThree.forEach((evaluation, index) => {
        const weight = config.EVALUATION_RECENCY_WEIGHTS[index] || 0;
        const outcome = isQualityBehaviorWarning(evaluation.addition)
            ? config.EVALUATION_OUTCOMES.WARNING
            : config.EVALUATION_OUTCOMES.CLEAN;
        const impact = outcome * weight;

        E += impact;

        if (impact > 0) {
            evalContributors.push({
                type: 'EVALUATION',
                id: idOf(evaluation),
                label: `Previous evaluation had a ${additionLabel(evaluation.addition)}`,
                impact,
            });
        }
    });

    E = clamp(E, 0, 1);

    let D_raw = 0;
    const dqContributors = [];

    for (const event of dqEvents) {
        const weight = recencyWeight(ageInMonths(event.timestamp, now));

        if (weight <= 0) continue;

        const base = getSevBase(event.obviousness, event.severity);

        if (base <= 0) continue;

        const impact = base * weight;

        D_raw += impact;
        dqContributors.push({
            type: 'DQ',
            id: idOf(event),
            label: `SEV ${event.obviousness}/${event.severity} ${event.type === 'nomination_reset' ? 'pop' : 'DQ'}`,
            obviousness: event.obviousness,
            severity: event.severity,
            impact,
            _raw: impact,
        });
    }

    const D = config.DQ_COMPONENT_CAP * (1 - Math.exp(-D_raw / config.DQ_SATURATION));

    if (D_raw > 0) {
        for (const contributor of dqContributors) {
            contributor.impact = (contributor._raw / D_raw) * D;
            delete contributor._raw;
        }
    }

    let P_raw = 0;
    const penaltyContributors = [];
    const recurrenceCutoff = new Date(now.getTime() - config.PENALTY_RECURRENCE_DAYS * 24 * 60 * 60 * 1000);
    let nRecent = 0;
    let activeSevereConcern = false;

    for (const penalty of penalties) {
        const createdAt = penalty.createdAt;
        const weight = recencyWeight(ageInMonths(createdAt, now));
        const base = config.PENALTY_WEIGHTS[penalty.severity] || 0;
        const impact = base * weight;

        if (new Date(createdAt) >= recurrenceCutoff) nRecent += 1;

        if (penalty.severity === 'severe' && weight >= config.SEVERE_RECENCY_MIN) {
            activeSevereConcern = true;
        }

        if (impact <= 0) continue;

        P_raw += impact;
        penaltyContributors.push({
            type: 'PENALTY',
            id: idOf(penalty),
            label: `${penaltySeverityLabel(penalty.severity)} ${penaltyTypeLabel(penalty.type)} penalty`,
            impact,
            _raw: impact,
        });
    }

    const recurrenceMultiplier = Math.min(
        config.PENALTY_RECURRENCE_CAP,
        1 + config.PENALTY_RECURRENCE_STEP * Math.max(0, nRecent - 1)
    );

    P_raw *= recurrenceMultiplier;

    const P = Math.min(config.PENALTY_COMPONENT_CAP, P_raw / config.PENALTY_SCALING_FACTOR);

    if (P_raw > 0) {
        for (const contributor of penaltyContributors) {
            contributor.impact = (contributor._raw / (P_raw / recurrenceMultiplier)) * P;
            delete contributor._raw;
        }
    }

    const C = 0;

    let score = 100 * (1 - (1 - E) * (1 - D) * (1 - P) * (1 - C));
    score = clamp(score, 0, 100);

    const policyCutoff = new Date(now.getTime() - config.POLICY_WINDOW_MONTHS * MS_PER_MONTH);
    const recentWarnings = evaluations.filter((evaluation) => {
        if (!isQualityBehaviorWarning(evaluation.addition)) return false;

        const at = evaluation.archivedAt || evaluation.deadline || evaluation.createdAt;

        return at && new Date(at) >= policyCutoff;
    });

    const typeCounts = {};

    for (const evaluation of recentWarnings) {
        typeCounts[evaluation.addition] = (typeCounts[evaluation.addition] || 0) + 1;
    }

    const highScrutiny = Object.keys(typeCounts).length >= 2;
    const sameTypeWarningKick = Object.values(typeCounts).some((count) => count >= 2);

    let policyFloor = null;

    if (highScrutiny) {
        score = Math.max(score, config.HIGH_SCRUTINY_FLOOR);
        policyFloor = 'highScrutiny';
    }

    if (activeSevereConcern) {
        score = Math.max(score, config.SEVERE_CONCERN_FLOOR);
        policyFloor = 'severeConcern';
    }

    score = Math.round(clamp(score, 0, 100));

    const level = classifyLevel(score);
    const contributors = [...evalContributors, ...dqContributors, ...penaltyContributors]
        .sort((a, b) => b.impact - a.impact);

    return {
        score,
        level,
        calculatedAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
        limitedHistory,
        components: {
            evaluation: round4(E),
            dq: round4(D),
            penalty: round4(P),
            conduct: C,
        },
        policy: {
            highScrutiny,
            sameTypeWarningKick,
            activeSevereConcern,
            floor: policyFloor,
        },
        contributors: contributors.map((c) => ({
            type: c.type,
            id: c.id,
            label: c.label,
            impact: round4(c.impact),
            ...(c.obviousness != null ? { obviousness: c.obviousness, severity: c.severity } : {}),
        })),
        guidance: config.RISK_GUIDANCE[level],
    };
}

function round4(n) {
    return Math.round(n * 10000) / 10000;
}

module.exports = {
    scoreBnRisk,
    recencyWeight,
    ageInMonths,
    getSevBase,
    isQualityBehaviorWarning,
    classifyLevel,
    clamp,
};
