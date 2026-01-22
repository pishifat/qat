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
    chatroomUsersPublic?: IUserDocument[];
    chatroomInitiated?: Date;
    chatroomMessages: {
        date: Date;
        content: string;
        user: IUserDocument;
        userIndex: number;
        isSystem: Boolean;
    }[];
    deadline?: Date;
    vetoFormat?: number;
}

export default interface IVetoModel extends Model<IVetoDocument> { }
