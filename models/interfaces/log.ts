import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

interface ILogDocument extends Document {
    user: IUserDocument;
    action: string;
    category: string;
    relatedId: any;
    isError: boolean;
}

export default interface ILogModel extends Model<ILogDocument> { 
    generate?: (userId: string, action: string, category: string, relatedId?: any) => Promise<void>;
    generateError?: (action: string, stack: string, extraInfo: string, userId?: string) => Promise<void>;
}
