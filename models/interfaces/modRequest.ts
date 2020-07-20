import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';

interface IModRequestDocument extends Document {
    user: IUserDocument;
    category: 'simple' | 'tech' | 'doubleBpm' | 'conceptual' | 'other';
    beatmapset: {
        osuId: number;
        artist: string;
        title: string;
        modes: string[];
        genre: string;
        language: string;
        numberDiffs: number;
        length: number;
        bpm: number;
        submittedAt: Date;
    };
    comment: string;
    reviews: {
        user: IUserDocument,
        action: string,
        comment: string,
    }[],
}

export default interface IModRequestModel extends Model<IModRequestDocument> { }
