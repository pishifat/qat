import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

export interface IMediationDocument extends Document {
    mediator: IUserDocument;
    comment?: string;
    vote?: number;
    reasonIndex?: number;
}

export interface IMediationModel extends Model<IMediationDocument> { }
