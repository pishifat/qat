import { Document, Model } from 'mongoose'

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
}

export interface IBeatmapsetModel extends Model<IBeatmapsetDocument> { }
