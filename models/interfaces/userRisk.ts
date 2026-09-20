import { Document, Model } from 'mongoose';
import { IUserDocument } from './user';

export interface IUserRiskDocument extends Document {
    user: IUserDocument;
    mode: string;
    score: number;
    level: string;
    limitedHistory: boolean;
    calculatedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export default interface IUserRiskModel extends Model<IUserRiskDocument> {}
