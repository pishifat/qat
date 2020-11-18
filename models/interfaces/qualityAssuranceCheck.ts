import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IAiessDocument } from './aiess';

interface IQualityAssuranceCheckDocument extends Document {
    user: IUserDocument;
    event: IAiessDocument;
    comment: string;
    timestamp: Date;
    mode: string;
}

export default interface IDocumentModel extends Model<IQualityAssuranceCheckDocument> { }
