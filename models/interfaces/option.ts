import { Document, Model } from 'mongoose'

export interface IOptionDocument extends Document {
    content: string;
    score: number;
    active?: boolean;
    metadataType?: string;
}

export interface IOptionModel extends Model<IOptionDocument> { }
