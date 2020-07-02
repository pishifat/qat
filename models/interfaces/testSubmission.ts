import { Document, Model } from 'mongoose'
import { ITestAnswerDocument } from './testAnswer';
import { IUserDocument } from './user';

export interface ITestSubmissionDocument extends Document {
    applicant: IUserDocument;
    mode: string;
    status: string;
    startedAt: Date;
    submittedAt: Date;
    totalScore: number;
    comment: string;
    answers?: ITestAnswerDocument[];
}

export interface ITestSubmissionModel extends Model<ITestSubmissionDocument> {
    generateTest?: (applicant: number, mode: string) => Promise<ITestSubmissionDocument & { error: string }>;
}
