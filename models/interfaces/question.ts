import { Document, Model } from 'mongoose'
import { IOptionDocument } from './option';

export interface IQuestionDocument extends Document {
    category: string;
    content: string;
    active?: boolean;
    questionType: string;
    options?: IOptionDocument[];
}

export interface IQuestionModel extends Model<IQuestionDocument> { }
