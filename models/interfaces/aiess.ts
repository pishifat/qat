import { Document, Model, Aggregate } from 'mongoose'
import { IQualityAssuranceCheckDocument } from './qualityAssuranceCheck';

interface IAiess {
    _id: any;
    beatmapsetId: number;
    userId: number;
    discussionId: number;
    artistTitle: string;
    genre: string;
    language: string;
    modes: string[];
    type: string;
    content: string;
    timestamp: Date;
    creatorId: number;
    creatorName: string;
    valid: number;
    obviousness: number;
    severity: number;
    mapperId: number;
    mapperTotalRanked: number;
    isBnOrNat: boolean;
    isUnique: boolean;
    effortBonus: number;
    responsibleNominators: number[];
    isReviewed: boolean;
    qaComment: string; // temporary field added during user activity for disqualified qa checks
    qualityAssuranceChecks: IQualityAssuranceCheckDocument[]; // virtual
}

export interface IAiessDocument extends IAiess, Document {
    _id: any;
}

interface IAiessByType {
    _id: string;
    events: IAiess[];
}

export interface IAiessModel extends Model<IAiessDocument> {
    getUniqueUserEvents?: (userId: number, minDate: Date, maxDate: Date, modes: string[], types: string[]) => Aggregate<IAiess[]>;
    getUserEvents?: (userId: number, minDate: Date, maxDate: Date, modes: string[], types: string[]) => Aggregate<IAiess[]>;
    getRelatedBeatmapsetEvents?: (userId: number, beatmapsetIds: number[], minDate: Date, maxDate: Date, modes: string[], type: string) => Aggregate<IAiess[]>;
    getAllActivity?: (minDate: Date, maxDate: Date, mode: string) => Promise<IAiessByType[] & { error?: string }>;
}
