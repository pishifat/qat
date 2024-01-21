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

const VisualContentConsiderations = [
    { name: 'sexualMinors', text: 'sexual content involving or targeted at minors', active: true },
    { name: 'gore', text: 'excessive violence, gore, dismemberment, decapitation, or maiming', active: true },
    { name: 'sexualInnuendo', text: 'significant sexual innuendo', active: true },
    { name: 'sexualPosturing', text: 'sexual posturing or solicitation', active: true },
    { name: 'erotic', text: 'erotic content or graphic displays of sexuality', active: true },
    { name: 'drugs', text: 'examples of drug use, preparation, or identification with illicit drug subculture', active: true },
    { name: 'inflammatory', text: 'depictions of deliberately inflammatory political, cultural, religious, or social content', active: true },
    { name: 'suicide', text: 'imagery depicting suicidal or self-harming behaviour, including preparation or imminent attempts', active: true },
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
const Languages = ['afrikaans', 'arabic', 'belarusian', 'cantonese', 'catalan', 'chinese', 'danish', 'dutch', 'estonian', 'filipino', 'finnish', 'french', 'galician', 'german', 'indonesian', 'italian', 'japanese', 'korean', 'lithuanian', 'malay', 'polish', 'portuguese', 'romanian', 'russian', 'serbian', 'spanish', 'swedish', 'thai', 'turkish', 'ukranian', 'urdu', 'vietnamese'];

module.exports = {
    EvaluationKind,
    AppEvaluationConsensus,
    BnEvaluationConsensus,
    ResignationConsensus,
    BnEvaluationAddition,
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
