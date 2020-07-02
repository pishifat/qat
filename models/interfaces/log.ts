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
    generate?: (userId: number, action: string, category: string, relatedId?: any) => Promise<void>;
}
