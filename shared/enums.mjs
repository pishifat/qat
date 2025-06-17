// ES Module version for frontend (Vite)
// evaluations
export const EvaluationKind = Object.freeze({
    AppEvaluation: 'application',
    BnEvaluation: 'currentBn',
    Resignation: 'resignation',
});

export const AppEvaluationConsensus = Object.freeze({
    Pass: 'pass',
    Fail: 'fail',
});

export const BnEvaluationConsensus = Object.freeze({
    FullBn: 'fullBn',
    ProbationBn: 'probationBn',
    RemoveFromBn: 'removeFromBn',
    RemainInNat: 'remainInNat',
    MoveToBn: 'moveToBn',
    RemoveFromNat: 'removeFromNat',
});

export const ResignationConsensus = Object.freeze({
    ResignedOnGoodTerms: 'resignedOnGoodTerms',
    ResignedOnStandardTerms: 'resignedOnStandardTerms',
});

export const BnEvaluationAddition = Object.freeze({
    LowActivityWarning: 'lowActivityWarning',
    BehaviorWarning: 'behaviorWarning',
    MapQualityWarning: 'mapQualityWarning',
    ModdingQualityWarning: 'moddingQualityWarning',
    None: 'none',
});

export const Cooldown = Object.freeze({
    None: 'none',
    Reduced: 'reduced',
    Standard: 'standard',
    Extended: 'extended',
});

export const VisualContentConsiderations = [
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
export const GenrePreferences = ['rock', 'pop', 'novelty', 'hip hop', 'electronic', 'metal', 'classical', 'folk', 'jazz', 'vocaloid', 'other'];
export const LanguagePreferences = ['instrumental', 'english', 'japanese', 'korean', 'chinese', 'other'];
export const DetailPreferences = ['anime', 'featured artist', 'game', 'movie', 'tv', 'doujin', 'cover', 'remix'];
export const MapperPreferences = ['new mapper', 'experienced mapper'];
export const OsuStylePreferences = ['simple', 'tech', 'alternating', 'conceptual', 'other'];
export const TaikoStylePreferences = ['simple', 'tech', 'SV heavy', 'double BPM', 'gimmick', 'other'];
export const CatchStylePreferences = ['simple', 'tech', 'hyperdashless', 'low AR', 'high CS', 'other'];
export const ManiaStylePreferences = ['rice', 'long notes', 'hybrid', 'SV heavy', 'dump', 'other'];
export const ManiaKeymodePreferences = ['4K', '7K', 'other keymode'];
export const Languages = ['afrikaans', 'arabic', 'belarusian', 'cantonese', 'catalan', 'chinese', 'danish', 'dutch', 'estonian', 'filipino', 'finnish', 'french', 'galician', 'german', 'indonesian', 'italian', 'japanese', 'korean', 'lithuanian', 'malay', 'polish', 'portuguese', 'romanian', 'russian', 'serbian', 'spanish', 'swedish', 'thai', 'turkish', 'ukrainian', 'urdu', 'vietnamese'];

// Default export
const enums = {
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

export default enums; 