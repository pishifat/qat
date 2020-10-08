const EvaluationKind = Object.freeze({
    AppEvaluation: 'application',
    BnEvaluation: 'currentBn',
    Resignation: 'resignation',
});

const AppEvaluationConsensus = Object.freeze({
    Pass: 'pass',
    Fail: 'fail',
});

const BnEvaluationConsensus = Object.freeze({
    FullBn: 'fullBn',
    ProbationBn: 'probationBn',
    RemoveFromBn: 'removeFromBn',
});

const ResignationConsensus = Object.freeze({
    ResignedOnGoodTerms: 'resignedOnGoodTerms',
    ResignedOnStandardTerms: 'resignedOnStandardTerms',
});

const BnEvaluationAddition = Object.freeze({
    LowActivityWarning: 'lowActivityWarning',
    BehaviorWarning: 'behaviorWarning',
    MapQualityWarning: 'mapQualityWarning',
    None: 'none',
});

module.exports = {
    EvaluationKind,
    AppEvaluationConsensus,
    BnEvaluationConsensus,
    ResignationConsensus,
    BnEvaluationAddition,
};
