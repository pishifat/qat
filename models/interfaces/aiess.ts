import { Document, Model, Aggregate } from 'mongoose'
import { IUserDocument } from './user';
import { IMediationDocument } from './mediation';

interface IAiess {
    _id: any;
    beatmapsetId: number;
    userId: number;
    postId: number;
    metadata: string;
    modes: string[];
    eventType: string;
    content: string;
    timestamp: Date;
    hostId: number;
    hostName: string;
    valid: number;
    obviousness: number;
    severity: number;
    mapperId: number;
    mapperTotalRanked: number;
    isBnOrNat: boolean;
    isUnique: boolean;
    effortBonus: number;
    responsibleNominators: number[];
    qualityAssuranceCheckers: IUserDocument[];
    qualityAssuranceComments: IMediationDocument[];
}

export interface IAiessDocument extends IAiess, Document { }

interface IAiessByEventType {
    _id: string;
    events: IAiess[];
}

export interface IAiessModel extends Model<IAiessDocument> {
    getUniqueUserEvents?: (userId: number, minDate: Date, maxDate: Date, modes: string[], eventTypes: string[]) => Aggregate<IAiess[]>;
    getUserEvents?: (userId: number, minDate: Date, maxDate: Date, modes: string[], eventTypes: string[]) => Aggregate<IAiess[]>;
    getRelatedBeatmapsetEvents?: (userId: number, beatmapsetIds: number[], minDate: Date, maxDate: Date, modes: string[], eventType: string) => Aggregate<IAiess[]>;
    getAllActivity?: (minDate: Date, maxDate: Date, mode: string) => Promise<IAiessByEventType[] & { error?: string }>;
}
