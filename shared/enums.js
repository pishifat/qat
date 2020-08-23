const EvaluationKind = Object.freeze({
    BnEvaluation: 'BnEvaluation',
    Resignation: 'Resignation',
    AppEvaluation: 'application',
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

module.exports = {
    EvaluationKind,
    AppEvaluationConsensus,
    BnEvaluationConsensus,
    ResignationConsensus,
};
