import { Document, Model } from 'mongoose'
import { IUserDocument } from '../user';
import { IModRequestDocument } from './modRequest';

export interface IModReviewDocument extends Document {
    modRequest: IModRequestDocument;
    user: IUserDocument;
    action: string;
    comment: string;
}

export interface IModReviewModel extends Model<IModReviewDocument> { }
