import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IMediationDocument } from './mediation';

interface IDiscussionDocument extends Document {
    mode: string;
    title: string;
    discussionLink: string;
    shortReason: string;
    isActive?: boolean;
    mediations?: IMediationDocument[];
    isNatOnly: boolean;
    neutralAllowed: boolean;
    creator: IUserDocument;
}

export default interface IDiscussionModel extends Model<IDiscussionDocument> { }
