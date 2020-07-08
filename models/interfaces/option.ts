import { Document, Model } from 'mongoose'

export interface IOptionDocument extends Document {
    content: string;
    score: number;
    active?: boolean;
}

export interface IOptionModel extends Model<IOptionDocument> { }
