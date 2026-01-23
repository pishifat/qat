import { Document, Model, DocumentQuery } from 'mongoose';
import { IAppEvaluationDocument, IBnEvaluationDocument } from './evaluations';

interface IUser {
    osuId: number;
    username: string;
    groups: string[];
    modesInfo: { 
        mode: string;
        level: string;
    }[]
    history: {
        date: Date;
        mode: string;
        kind: string;
        group: string;
        relatedEvaluation: IAppEvaluationDocument | IBnEvaluationDocument;
    }[]
    isVetoMediator: boolean;
    isBnEvaluator: boolean;
    inBag: boolean;
    isTrialNat: boolean;
    isBannedFromBn: boolean;
    isNatLeader: boolean;
    bnProfileBadge: number;
    natProfileBadge: number;
    nominationsProfileBadge: number;
    rankedBeatmapsets: number;
    discordId: string;
    requestStatus: string[];
    genrePreferences: string[];
    genreNegativePreferences: string[];
    languagePreferences: string[];
    languageNegativePreferences: string[];
    osuStylePreferences: string[];
    osuStyleNegativePreferences: string[];
    taikoStylePreferences: string[];
    taikoStyleNegativePreferences: string[];
    catchStylePreferences: string[];
    catchStyleNegativePreferences: string[];
    maniaStylePreferences: string[];
    maniaStyleNegativePreferences: string[];
    maniaKeymodePreferences: string[];
    maniaKeymodeNegativePreferences: string[];
    detailPreferences: string[];
    detailNegativePreferences: string[];
    mapperPreferences: string[];
    mapperNegativePreferences: string[];
    requestLink: string;
    languages: string[];
    lastMarkedAsLowActivity: Date;
    showExplicitContent: boolean;
    cover: string;
    requestInfo: string;
    lastOpenedForRequests: Date;
    isActiveContentReviewer: boolean;
    subjectiveEvalFeedback: boolean;
    lastActivityCheck: Date;
    countryCode?: string;

    // not used in model
    genreCount: number;
    languageCount: number;
    styleCount: number;
    detailCount: number;
    mapperExperienceCount: number;
    totalPreferenceCount: number;
}

export interface IUserDocument extends IUser, Document {
    isNat: boolean;
    isBn: boolean;
    isBnOrNat: boolean;
    isNatOrTrialNat: boolean;
    hasBasicAccess: boolean;
    hasFullReadAccess: boolean;
    modes: string[];
    fullModes: string[];
    probationModes: string[];
    evaluatorModes: string[];
    bnDuration: number;
    natDuration: number;
    isBnFor: (mode: string) => boolean;
    isFullBnFor: (mode: string) => boolean;
    /** Used in notifications */
    recentQaChecks?: number;
    allQaChecks?: number;
    isPishifat?: boolean;
}

interface IUsersByGroup {
    _id: string;
    users: {
        id: IUserDocument['_id'];
        username: IUserDocument['username'];
        osuId: IUserDocument['osuId'];
        group: IUserDocument['groups'];
        level: string;
    }[];
}

export interface IUserModel extends Model<IUserDocument> {
    findByUsername?: (username: string) => DocumentQuery<IUserDocument, IUserDocument>;
    findByUsernameOrOsuId?: (user: string | number) => DocumentQuery<IUserDocument, IUserDocument>;
    getAllByMode?: (includeFullBns: boolean, includeProbation: boolean, includeNat: boolean) => Promise<IUsersByGroup[] & { error?: string }>;
    getAllMediators?: () => Promise<IUser[] & { error?: string }>;
    getAllBnAndNat?: () => Promise<IUser[] & { error?: string }>;
    getAssignedNat?: (mode: string, evaluatedUserId: string, excludeOsuIds?: number[], sampleSize?: number) => Promise<IUserDocument[]>;
    getAssignedTrialNat?: (mode: string, excludeOsuIds?: number[], sampleSize?: number) => Promise<IUserDocument[]>;
}
