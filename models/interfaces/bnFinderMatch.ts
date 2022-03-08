import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IBeatmapsetDocument } from './modRequests/beatmapset';

export interface IBnFinderMatchDocument extends Document {
    user: IUserDocument;
    isMatch: boolean;
    isExpired: boolean;
    beatmapset: IBeatmapsetDocument;
    genres: string[];
    languages: string[];
    styles: string[];
    details: string[];
    mapperExperience: string;
    isPostponed: boolean;
}

export default interface IBnFinderMatchModel extends Model<IBnFinderMatchDocument> { }