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
    deadline?: Date;
    vouchingUsers?: IUserDocument[];
    chatroomUsers?: IUserDocument[];
    chatroomUsersPublic?: IUserDocument[];
    chatroomInitiated?: Date;
    chatroomMessages: {
        date: Date;
        content: string;
        user: IUserDocument;
        userIndex: number;
        role: 'system' | 'moderator' | 'vetoer' | 'voucher' | 'user';
    }[];
    chatroomMediationRequestedUsers?: IUserDocument[];
    chatroomVoteEnabled?: Boolean;
    chatroomUpholdVoters?: IUserDocument[];
    chatroomDismissVoters?: IUserDocument[];
    chatroomLocked?: Boolean;
    discussionChatroom?: string;
    /** Set on API responses when the viewer is in the linked reusable discussion chatroom. */
    viewerIsDiscussionParticipant?: boolean;
    publicMediations?: IMediationDocument[];
    vetoFormat?: number;
}

export default interface IVetoModel extends Model<IVetoDocument> { }
