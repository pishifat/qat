import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { IMediationDocument } from './mediation';

interface IVetoDocument extends Document {
    vetoer: IUserDocument;
    mode: string;
    reasons: Array<String>;
    beatmapId: string;
    beatmapTitle: string;
    beatmapMapper: string;
    beatmapMapperId: number;
    status?: string;
    mediations?: IMediationDocument[];
    vouchingUsers?: IUserDocument[];
    chatroomUsers?: IUserDocument[];
    chatroomInitiated?: Date;
    deadline?: Date;
    vetoFormat?: number;
}

export default interface IVetoModel extends Model<IVetoDocument> { }
