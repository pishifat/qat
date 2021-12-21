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
    bnProfileBadge: number;
    natProfileBadge: number;
    rankedBeatmapsets: number;
    discordId: string;
    requestStatus: string[];
    genrePreferences: string[];
    languagePreferences: string[];
    stylePreferences: string[];
    detailPreferences: string[];
    mapperPreferences: string[];
    requestLink: string;
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
    bnDuration: number;
    natDuration: number;
    isBnFor: (mode: string) => boolean;
    isFullBnFor: (mode: string) => boolean;
    /** Used in notifications */
    recentQaChecks?: number;
    allQaChecks?: number;
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
    findByUsernameOrOsuId?: (user: string) => DocumentQuery<IUserDocument, IUserDocument>;
    getAllByMode?: (includeFullBns: boolean, includeProbation: boolean, includeNat: boolean) => Promise<IUsersByGroup[] & { error?: string }>;
    getAllMediators?: () => Promise<IUser[] & { error?: string }>;
    getAssignedNat?: (mode: string, excludeOsuIds?: number[], sampleSize?: number) => Promise<IUserDocument[]>;
    getAssignedTrialNat?: (mode: string, excludeOsuIds?: number[], sampleSize?: number) => Promise<IUserDocument[]>;
}
