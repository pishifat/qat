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
    RemainInNat: 'remainInNat',
    MoveToBn: 'moveToBn',
    RemoveFromNat: 'removeFromNat',
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

const Cooldown = Object.freeze({
    None: 'none',
    Reduced: 'reduced',
    Standard: 'standard',
    Extended: 'extended',
});

const PenaltyType = Object.freeze({
    MappingQuality: 'mappingQuality',
    ModdingQuality: 'moddingQuality',
    Behavior: 'behavior',
    Other: 'other',
});

const PenaltySeverity = Object.freeze({
    Minor: 'minor',
    Moderate: 'moderate',
    Major: 'major',
    Severe: 'severe',
});

const PenaltySourceType = Object.freeze({
    None: 'none',
    Dq: 'dq',
    Evaluation: 'evaluation',
});

const RiskLevel = Object.freeze({
    Low: 'LOW',
    Medium: 'MEDIUM',
    High: 'HIGH',
});

const VisualContentConsiderations = [
    { name: 'sexualMinors', text: 'sexual content involving or targeted at minors', active: true },
    { name: 'gore', text: 'excessive violence, gore, dismemberment, decapitation, or maiming', active: true },
    { name: 'sexualInnuendo', text: 'significant sexual innuendo', active: true },
    { name: 'sexualPosturing', text: 'sexual posturing or solicitation', active: true },
    { name: 'erotic', text: 'erotic content or graphic displays of sexuality', active: true },
    { name: 'drugs', text: 'examples of drug use, preparation, or identification with illicit drug subculture', active: true },
    { name: 'inflammatory', text: 'depictions of deliberately inflammatory political, cultural, religious, or social content', active: true },
    { name: 'suicide', text: 'imagery depicting suicidal or self-harming behaviour, including preparation or imminent attempts', active: true },
    { name: 'other', text: 'other (specify in comment)', active: true },
];

// preferences
const GenrePreferences = ['rock', 'pop', 'novelty', 'hip hop', 'electronic', 'metal', 'classical', 'folk', 'jazz', 'vocaloid', 'other'];
const LanguagePreferences = ['instrumental', 'english', 'japanese', 'korean', 'chinese', 'other'];
const DetailPreferences = ['anime', 'featured artist', 'game', 'movie', 'tv', 'doujin', 'cover', 'remix'];
const MapperPreferences = ['new mapper', 'experienced mapper'];
const OsuStylePreferences = ['simple', 'tech', 'alternating', 'conceptual', 'other'];
const TaikoStylePreferences = ['simple', 'tech', 'SV heavy', 'double BPM', 'gimmick', 'other'];
const CatchStylePreferences = ['simple', 'tech', 'hyperdashless', 'low AR', 'high CS', 'other'];
const ManiaStylePreferences = ['rice', 'long notes', 'hybrid', 'SV heavy', 'dump', 'other'];
const ManiaKeymodePreferences = ['4K', '7K', 'other keymode'];
const Languages = ['afrikaans', 'arabic', 'belarusian', 'cantonese', 'catalan', 'chinese', 'danish', 'dutch', 'estonian', 'filipino', 'finnish', 'french', 'galician', 'german', 'hebrew', 'indonesian', 'italian', 'japanese', 'korean', 'lithuanian', 'malay', 'polish', 'portuguese', 'romanian', 'russian', 'serbian', 'spanish', 'swedish', 'telugu', 'thai', 'turkish', 'ukrainian', 'urdu', 'vietnamese'];

module.exports = {
    EvaluationKind,
    AppEvaluationConsensus,
    BnEvaluationConsensus,
    ResignationConsensus,
    BnEvaluationAddition,
    PenaltyType,
    PenaltySeverity,
    PenaltySourceType,
    RiskLevel,
    Cooldown,
    VisualContentConsiderations,
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
