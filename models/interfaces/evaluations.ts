import { Document, Model } from 'mongoose'
import { IUserDocument } from './user';
import { ITestSubmissionDocument } from './testSubmission';
import { IReviewDocument } from './review';

interface IEvaluationBase {
    user: IUserDocument;
    mode: string;
    reviews?: IReviewDocument[];
    active?: boolean;
    discussion?: boolean;
    feedback?: string;
    cooldownDate?: Date;
    natEvaluators?: IUserDocument[];
    bnEvaluators?: IUserDocument[];
    archivedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    isApplication?: boolean;
    isBnEvaluation?: boolean;
    isResignation?: boolean;
}

export interface IAppEvaluationDocument extends IEvaluationBase, Document {
    consensus?: string;
    mods: string[];
    reasons: string[];
    test?: ITestSubmissionDocument;
    deadline?: Date;
    kind?: string;
}

export interface IAppEvaluationModel extends Model<IAppEvaluationDocument> {
    findActiveApps?: () => Promise<IAppEvaluationDocument[]>;
}

export interface IBnEvaluationDocument extends IEvaluationBase, Document {
    consensus?: string;
    deadline?: Date;
    addition?: string;
    kind?: string;
}

export interface IBnEvaluationModel extends Model<IBnEvaluationDocument> {
    findActiveEvaluations?: (mongoId: string) => Promise<IBnEvaluationDocument[]>;
    deleteUserActiveEvaluations?: (userId: number) => Promise<{ ok: number, deletedCount: number, n: number }>;
}

export interface IResignationEvaluationDocument extends IEvaluationBase, Document {
    consensus?: string;
    deadline?: Date;
    kind?: string;
}

export interface IResignationEvaluationModel extends Model<IResignationEvaluationDocument> {
    findActiveResignations?: () => Promise<IResignationEvaluationDocument[]>;
}

export interface IEvaluationDocument extends IEvaluationBase, IBnEvaluationDocument, Document {
}

export interface IEvaluationModel extends Model<IEvaluationDocument> {
    findActiveEvaluations?: (mongoId: string) => Promise<IEvaluationDocument[]>;
    deleteUserActiveEvaluations?: (userId: number) => Promise<{ ok: number, deletedCount: number, n: number }>;
}
