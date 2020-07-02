import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IMediationDocument } from './mediation';

interface IVetoDocument extends Document {
    vetoer: IUserDocument;
    mode: string;
    discussionLink: string;
    beatmapId: string;
    beatmapTitle: string;
    beatmapMapper: string;
    beatmapMapperId: number;
    shortReason: string;
    status?: string;
    mediations?: IMediationDocument[];
    deadline?: Date;
}

export default interface IVetoModel extends Model<IVetoDocument> { }
