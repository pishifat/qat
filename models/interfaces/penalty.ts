import { Document, Model } from 'mongoose';
import { IUserDocument } from './user';

export interface IPenaltyDocument extends Document {
    user: IUserDocument;
    mode: string;
    type: string;
    severity: string;
    reason: string;
    sourceType: string;
    sourceId?: any;
    createdBy: IUserDocument;
    createdAt?: Date;
    updatedAt?: Date;
}

export default interface IPenaltyModel extends Model<IPenaltyDocument> {}
