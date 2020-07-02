import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

export interface IReviewDocument extends Document {
    evaluator: IUserDocument;
    behaviorComment: string;
    moddingComment: string;
    vote: number;
}

export interface IReviewModel extends Model<IReviewDocument> { }
