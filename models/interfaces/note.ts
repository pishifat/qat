import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

interface INoteDocument extends Document {
    author: IUserDocument;
    user: IUserDocument;
    comment: string;
    isHidden?: boolean;
}

export default interface IDocumentModel extends Model<INoteDocument> { }
