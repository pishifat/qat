import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

export interface IAnnouncementDocument extends Document {
    content: string;
    title: string;
    roles: string[];
    author: IUserDocument;
}

export default interface IAnnouncementModel extends Model<IAnnouncementDocument> { }
