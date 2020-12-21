import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IMediationDocument } from './mediation';

interface IDiscussionDocument extends Document {
    mode: string;
    title: string;
    discussionLink: string;
    shortReason: string;
    isActive?: boolean;
    isNatOnly: boolean;
    neutralAllowed: boolean;
    reasonAllowed: boolean;
    isContentReview: boolean;
    mediations?: IMediationDocument[];
    creator: IUserDocument;
    createdAt?: Date;
    updatedAt?: Date;
}

export default interface IDiscussionModel extends Model<IDiscussionDocument> { }
