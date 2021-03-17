import { Document, Model, DocumentQuery } from 'mongoose';

export interface ISettingsDocument extends Document {
    modeSettings: {
        mode: String;
        evalsRequired: Number;
    }[];
}

export interface ISettingsModel extends Model<ISettingsDocument> {
    getModeEvaluationsRequired?: (mode: string) => Promise<number>;
}
