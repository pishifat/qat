// evaluations
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
    ModdingQualityWarning: 'moddingQualityWarning',
    None: 'none',
});

// BN Finder
const GenrePreferences = ['rock', 'pop', 'novelty', 'hip hop', 'electronic', 'metal', 'classical', 'folk', 'jazz', 'vocaloid', 'other'];
const LanguagePreferences = ['instrumental', 'english', 'japanese', 'korean', 'chinese', 'other'];
const DetailPreferences = ['anime', 'featured artist', 'game', 'movie', 'tv', 'doujin', 'cover', 'remix'];
const MapperPreferences = ['new mapper', 'experienced mapper'];
const OsuStylePreferences = ['simple', 'tech', 'alternating', 'conceptual', 'other'];
const TaikoStylePreferences = ['simple', 'tech', 'SV heavy', 'other'];
const CatchStylePreferences = ['simple', 'tech', 'hyperdashless', 'low AR', 'high CS', 'other'];
const ManiaStylePreferences = ['rice', 'long notes', 'hybrid', 'SV heavy', 'dump', 'other'];
const ManiaKeymodePreferences = ['4K', '7K', 'other keymode'];
const Languages = ['afrikaans', 'arabic', 'belarusian', 'cantonese', 'catalan', 'chinese', 'danish', 'dutch', 'filipino', 'finnish', 'french', 'galician', 'german', 'indonesian', 'italian', 'japanese', 'korean', 'lithuanian', 'malay', 'polish', 'portuguese', 'russian', 'serbian', 'spanish', 'swedish', 'thai', 'turkish', 'urdu', 'vietnamese'];

module.exports = {
    EvaluationKind,
    AppEvaluationConsensus,
    BnEvaluationConsensus,
    ResignationConsensus,
    BnEvaluationAddition,
    GenrePreferences,
    LanguagePreferences,
    DetailPreferences,
    MapperPreferences,
    OsuStylePreferences,
    TaikoStylePreferences,
    CatchStylePreferences,
    ManiaStylePreferences,
    ManiaKeymodePreferences,
    Languages,
};
