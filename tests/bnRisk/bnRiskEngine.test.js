'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { scoreBnRisk, recencyWeight, getSevBase } = require('../../shared/bnRiskEngine');
const config = require('../../shared/bnRiskConfig');

function monthsAgo(months, now = new Date()) {
    return new Date(now.getTime() - months * 1000 * 60 * 60 * 24 * 30.4375);
}

function warningEval(monthsAgoValue, addition = 'mapQualityWarning', now) {
    return {
        id: `eval-${addition}-${monthsAgoValue}`,
        addition,
        archivedAt: monthsAgo(monthsAgoValue, now),
        consensus: 'fullBn',
    };
}

function cleanEval(monthsAgoValue, now) {
    return {
        id: `eval-clean-${monthsAgoValue}`,
        addition: 'none',
        archivedAt: monthsAgo(monthsAgoValue, now),
        consensus: 'fullBn',
    };
}

function penalty({ severity = 'moderate', type = 'mappingQuality', months = 0, now }) {
    return {
        id: `p-${severity}-${months}`,
        severity,
        type,
        createdAt: monthsAgo(months, now),
    };
}

function dq({ obviousness, severity, months = 0, type = 'disqualify', now }) {
    return {
        id: `dq-${obviousness}-${severity}-${months}`,
        obviousness,
        severity,
        type,
        timestamp: monthsAgo(months, now),
    };
}

describe('bnRiskEngine', () => {
    const now = new Date('2026-08-30T12:00:00.000Z');

    it('returns LOW with limited history when there is no evidence', () => {
        const result = scoreBnRisk({ evaluations: [], dqEvents: [], penalties: [], now });

        assert.equal(result.level, 'LOW');
        assert.equal(result.score, 0);
        assert.equal(result.limitedHistory, true);
        assert.equal(result.components.conduct, 0);
        assert.equal(result.policy.highScrutiny, false);
        assert.equal(result.policy.sameTypeWarningKick, false);
    });

    it('treats a single clean evaluation as LOW without limited history', () => {
        const result = scoreBnRisk({
            evaluations: [cleanEval(1, now)],
            now,
        });

        assert.equal(result.limitedHistory, false);
        assert.equal(result.level, 'LOW');
        assert.equal(result.score, 0);
        assert.equal(result.components.evaluation, 0);
    });

    it('maps a recent quality/behavior warning to MEDIUM via E = 0.45', () => {
        const result = scoreBnRisk({
            evaluations: [warningEval(1, 'moddingQualityWarning', now)],
            now,
        });

        assert.equal(result.components.evaluation, 0.45);
        assert.equal(result.score, 45);
        assert.equal(result.level, 'MEDIUM');
        assert.equal(result.limitedHistory, false);
        assert.equal(result.policy.floor, 'oneWarning');
        assert.ok(result.contributors.some(c => c.type === 'EVALUATION'));
    });

    it('ignores probation and low-activity additions', () => {
        const result = scoreBnRisk({
            evaluations: [{
                id: 'probation',
                addition: 'lowActivityWarning',
                archivedAt: monthsAgo(1, now),
                consensus: 'probationBn',
            }],
            now,
        });

        assert.equal(result.score, 0);
        assert.equal(result.level, 'LOW');
    });

    it('keeps an aged warning at MEDIUM via the one-warning floor', () => {
        const recovered = scoreBnRisk({
            evaluations: [
                cleanEval(1, now),
                cleanEval(4, now),
                warningEval(7, 'mapQualityWarning', now),
            ],
            now,
        });

        assert.ok(recovered.components.evaluation < 0.3);
        assert.equal(recovered.score, 30);
        assert.equal(recovered.level, 'MEDIUM');
        assert.equal(recovered.policy.floor, 'oneWarning');
    });

    it('includes a 10-month-old warning that is no longer in the last three evals', () => {
        const result = scoreBnRisk({
            evaluations: [
                cleanEval(1, now),
                cleanEval(4, now),
                cleanEval(7, now),
                warningEval(10, 'moddingQualityWarning', now),
            ],
            now,
        });

        assert.equal(result.components.evaluation, 0.135);
        assert.equal(result.score, 30);
        assert.equal(result.level, 'MEDIUM');
        assert.equal(result.policy.floor, 'oneWarning');
        assert.ok(result.contributors.some(c => c.type === 'EVALUATION'));
    });

    it('ignores a warning older than 12 months', () => {
        const asFourth = scoreBnRisk({
            evaluations: [
                cleanEval(1, now),
                cleanEval(4, now),
                cleanEval(7, now),
                warningEval(14, 'behaviorWarning', now),
            ],
            now,
        });
        const asMostRecent = scoreBnRisk({
            evaluations: [warningEval(14, 'behaviorWarning', now)],
            now,
        });

        assert.equal(asFourth.score, 0);
        assert.equal(asFourth.level, 'LOW');
        assert.equal(asFourth.policy.floor, null);
        assert.equal(asMostRecent.components.evaluation, 0);
        assert.equal(asMostRecent.score, 0);
        assert.equal(asMostRecent.policy.floor, null);
    });

    it('counts a fourth evaluation inside the 12-month window in E', () => {
        const withThree = scoreBnRisk({
            evaluations: [
                warningEval(1, 'mapQualityWarning', now),
                warningEval(4, 'mapQualityWarning', now),
                warningEval(7, 'mapQualityWarning', now),
            ],
            now,
        });
        const withFour = scoreBnRisk({
            evaluations: [
                warningEval(1, 'mapQualityWarning', now),
                warningEval(4, 'mapQualityWarning', now),
                warningEval(7, 'mapQualityWarning', now),
                warningEval(10, 'behaviorWarning', now),
            ],
            now,
        });

        assert.ok(withFour.components.evaluation > withThree.components.evaluation);
    });

    it('increases risk modestly for several low-SEV DQs and more for one severe DQ', () => {
        const severalLow = scoreBnRisk({
            dqEvents: [
                dq({ obviousness: 0, severity: 1, months: 1, now }),
                dq({ obviousness: 1, severity: 0, months: 1, now }),
                dq({ obviousness: 1, severity: 1, months: 2, now }),
            ],
            now,
        });
        const oneSevere = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 3, months: 0, now })],
            now,
        });

        assert.ok(severalLow.score > 0);
        assert.ok(severalLow.score < 30);
        assert.ok(oneSevere.score > severalLow.score);
        assert.ok(oneSevere.components.dq <= config.DQ_COMPONENT_CAP);
    });

    it('counts pops with the same SEV table as DQs', () => {
        const asDq = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 2, months: 0, type: 'disqualify', now })],
            now,
        });
        const asPop = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 2, months: 0, type: 'nomination_reset', now })],
            now,
        });

        assert.equal(asDq.score, asPop.score);
        assert.ok(asPop.contributors[0].label.includes('pop'));
        assert.equal(asPop.contributors[0].obviousness, 2);
        assert.equal(asPop.contributors[0].severity, 2);
    });

    it('gives unscored DQs zero contribution', () => {
        const result = scoreBnRisk({
            dqEvents: [{ id: 'unscored', timestamp: now, type: 'disqualify' }],
            now,
        });

        assert.equal(result.score, 0);
        assert.equal(result.contributors.length, 0);
    });

    it('decays DQ contribution with recency and ignores events older than 24 months', () => {
        const recent = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 3, months: 0, now })],
            now,
        });
        const halfLife = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 3, months: 6, now })],
            now,
        });
        const year = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 3, months: 12, now })],
            now,
        });
        const tooOld = scoreBnRisk({
            dqEvents: [dq({ obviousness: 2, severity: 3, months: 25, now })],
            now,
        });

        assert.ok(recent.score > halfLife.score);
        assert.ok(halfLife.score > year.score);
        assert.equal(tooOld.score, 0);
        assert.ok(Math.abs(recencyWeight(6) - 0.5) < 0.01);
        assert.ok(Math.abs(recencyWeight(12) - 0.25) < 0.01);
    });

    it('raises risk for several recent moderate penalties and more for repeated serious ones', () => {
        const severalModerate = scoreBnRisk({
            penalties: [
                penalty({ severity: 'moderate', months: 0, now }),
                penalty({ severity: 'moderate', months: 0.5, now }),
                penalty({ severity: 'moderate', months: 1, now }),
            ],
            now,
        });
        const repeatedSevere = scoreBnRisk({
            penalties: [
                penalty({ severity: 'severe', months: 0, now }),
                penalty({ severity: 'major', months: 0.2, now }),
            ],
            now,
        });

        assert.ok(severalModerate.level === 'LOW' || severalModerate.level === 'MEDIUM');
        assert.ok(repeatedSevere.score > severalModerate.score);
        assert.equal(repeatedSevere.level, 'HIGH');
        assert.equal(repeatedSevere.policy.activeSevereConcern, true);
        assert.equal(repeatedSevere.policy.floor, 'severeConcern');
        assert.ok(repeatedSevere.score >= 80);
    });

    it('applies a high-scrutiny floor of 60 for two different warning types in 12 months', () => {
        const result = scoreBnRisk({
            evaluations: [
                warningEval(1, 'mapQualityWarning', now),
                warningEval(3, 'behaviorWarning', now),
            ],
            now,
        });

        assert.equal(result.policy.highScrutiny, true);
        assert.equal(result.policy.sameTypeWarningKick, false);
        assert.ok(result.score >= 60);
        assert.equal(result.level, 'HIGH');
        assert.equal(result.policy.floor, 'highScrutiny');
    });

    it('puts two same-type warnings at HIGH without using the high-scrutiny floor', () => {
        const result = scoreBnRisk({
            evaluations: [
                warningEval(1, 'mapQualityWarning', now),
                warningEval(3, 'mapQualityWarning', now),
            ],
            now,
        });

        assert.equal(result.policy.sameTypeWarningKick, true);
        assert.equal(result.policy.highScrutiny, false);
        assert.equal(result.level, 'HIGH');
        assert.ok(result.score >= 60);
        assert.equal(result.policy.floor, 'twoWarnings');
    });

    it('does not mix modes: scoring only sees the provided records', () => {
        const osu = scoreBnRisk({
            evaluations: [warningEval(1, 'mapQualityWarning', now)],
            now,
        });
        const taiko = scoreBnRisk({
            evaluations: [cleanEval(1, now)],
            now,
        });

        assert.equal(osu.score, 45);
        assert.equal(taiko.score, 0);
    });

    it('always reports conduct as 0', () => {
        const result = scoreBnRisk({
            evaluations: [warningEval(1, 'behaviorWarning', now)],
            penalties: [penalty({ severity: 'severe', type: 'behavior', months: 0, now })],
            now,
        });

        assert.equal(result.components.conduct, 0);
    });

    it('caps the penalty component', () => {
        const result = scoreBnRisk({
            penalties: [
                penalty({ severity: 'severe', months: 0, now }),
                penalty({ severity: 'severe', months: 0.1, now }),
                penalty({ severity: 'severe', months: 0.2, now }),
                penalty({ severity: 'major', months: 0.3, now }),
            ],
            now,
        });

        assert.ok(result.components.penalty <= config.PENALTY_COMPONENT_CAP);
    });

    it('looks up interpolated SEV weights', () => {
        assert.equal(getSevBase(0, 2), 2);
        assert.equal(getSevBase(0, 3), 4);
        assert.equal(getSevBase(1, 3), 11);
        assert.equal(getSevBase(2, 3), 16);
        assert.equal(getSevBase(null, 2), 0);
    });
});
