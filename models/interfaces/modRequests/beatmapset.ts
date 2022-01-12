import { Document, Model } from 'mongoose'
import { IUserDocument } from '../user';

export interface IBeatmapsetDocument extends Document {
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
    mapperUsername: string;
    mapperOsuId: number;

    fullTitle: string;
    totalLength: number;
    totalLengthString: string;
}

export interface IBeatmapsetModel extends Model<IBeatmapsetDocument> { }
