import { Document, Model } from 'mongoose'
import { IUserDocument } from '../user';
import { IBeatmapsetDocument } from './beatmapset';
import { IModReviewDocument } from './modReview';

export interface IModRequestDocument extends Document {
    user: IUserDocument;
    category: 'simple' | 'tech' | 'doubleBpm' | 'conceptual' | 'other';
    beatmapset: IBeatmapsetDocument;
    comment: string;
    createdAt?: Date;
    /** virtually populated */
    modReviews: IModReviewDocument[],
}

export interface IModRequestModel extends Model<IModRequestDocument> { }
