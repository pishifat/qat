import { Document, Model, DocumentQuery } from 'mongoose';

export interface ISettingsDocument extends Document {
    modeSettings: {
        mode: String;
        evalsRequired: Number;
        hasTrialNat: Boolean;
    }[];
}

export interface ISettingsModel extends Model<ISettingsDocument> {
    getModeEvaluationsRequired?: (mode: string) => Promise<number>;
    getModeHasTrialNat?: (mode: string) => Promise<boolean>;
}
