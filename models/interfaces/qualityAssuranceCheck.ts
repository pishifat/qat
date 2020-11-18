import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IAiessDocument } from './aiess';

export interface IQualityAssuranceCheckDocument extends Document {
    user: IUserDocument;
    event: IAiessDocument;
    comment: string;
    timestamp: Date;
    mode: string;
}

export default interface IQualityAssuranceCheckModel extends Model<IQualityAssuranceCheckDocument> { }
