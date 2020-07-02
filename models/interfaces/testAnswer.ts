import { Document, Model } from 'mongoose'
import { ITestSubmissionDocument } from './testSubmission';
import { IOptionDocument } from './option';
import { IQuestionDocument } from './question';

export interface ITestAnswerDocument extends Document {
    test: ITestSubmissionDocument;
    question: IQuestionDocument;
    optionsChosen: IOptionDocument[];
    feedback: string;
}

export interface ITestAnswerModel extends Model<ITestAnswerDocument> { }
