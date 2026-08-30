'use strict';

const RISK_LEVEL = Object.freeze({
    Low: 'LOW',
    Medium: 'MEDIUM',
    High: 'HIGH',
});

const RISK_LOW_MAX = 29;
const RISK_MEDIUM_MAX = 59;

const RISK_HALF_LIFE_MONTHS = 6;
const DQ_MAX_AGE_MONTHS = 24;
const POLICY_WINDOW_MONTHS = 12;
const SEVERE_RECENCY_MIN = 0.25;

const DQ_COMPONENT_CAP = 0.25;
const DQ_SATURATION = 12;

const PENALTY_COMPONENT_CAP = 0.40;
const PENALTY_SCALING_FACTOR = 80;
const PENALTY_RECURRENCE_DAYS = 90;
const PENALTY_RECURRENCE_STEP = 0.25;
const PENALTY_RECURRENCE_CAP = 1.75;
const LINKED_PENALTY_MULTIPLIER = 0.5;

const HIGH_SCRUTINY_FLOOR = 60;
const SEVERE_CONCERN_FLOOR = 80;

const EVALUATION_RECENCY_WEIGHTS = Object.freeze([1.0, 0.6, 0.3]);

const EVALUATION_OUTCOMES = Object.freeze({
    CLEAN: 0.00,
    WARNING: 0.45,
});

const WARNING_ADDITIONS = Object.freeze([
    'mapQualityWarning',
    'moddingQualityWarning',
    'behaviorWarning',
]);

const PENALTY_WEIGHTS = Object.freeze({
    minor: 3,
    moderate: 7,
    major: 15,
    severe: 25,
});

const SEV_WEIGHTS = Object.freeze({
    '0/0': 0,
    '0/1': 0.5,
    '0/2': 2,
    '0/3': 4,
    '1/0': 1,
    '1/1': 3,
    '1/2': 7,
    '1/3': 11,
    '2/0': 2,
    '2/1': 5,
    '2/2': 11,
    '2/3': 16,
});

const RISK_GUIDANCE = Object.freeze({
    LOW: 'Routine sanity check. No recent evidence suggests elevated concern. Consider contextual signals such as mapper variety and nomination distribution.',
    MEDIUM: 'Additional attention recommended. Review recent DQs, penalties, and previous evaluation concerns, with particular attention to whether those concerns have recurred.',
    HIGH: 'Heightened scrutiny recommended. Review recent work carefully and investigate all significant recent concerns before determining the evaluation outcome.',
});

const GAMEPLAY_MODES = Object.freeze(['osu', 'taiko', 'catch', 'mania']);

const CACHE_MAX_AGE_MS = 25 * 60 * 60 * 1000;

module.exports = {
    RISK_LEVEL,
    RISK_LOW_MAX,
    RISK_MEDIUM_MAX,
    RISK_HALF_LIFE_MONTHS,
    DQ_MAX_AGE_MONTHS,
    POLICY_WINDOW_MONTHS,
    SEVERE_RECENCY_MIN,
    DQ_COMPONENT_CAP,
    DQ_SATURATION,
    PENALTY_COMPONENT_CAP,
    PENALTY_SCALING_FACTOR,
    PENALTY_RECURRENCE_DAYS,
    PENALTY_RECURRENCE_STEP,
    PENALTY_RECURRENCE_CAP,
    LINKED_PENALTY_MULTIPLIER,
    HIGH_SCRUTINY_FLOOR,
    SEVERE_CONCERN_FLOOR,
    EVALUATION_RECENCY_WEIGHTS,
    EVALUATION_OUTCOMES,
    WARNING_ADDITIONS,
    PENALTY_WEIGHTS,
    SEV_WEIGHTS,
    RISK_GUIDANCE,
    GAMEPLAY_MODES,
    CACHE_MAX_AGE_MS,
};
