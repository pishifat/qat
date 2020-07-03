const mongoose = require('mongoose');

const testAnswerSchema = new mongoose.Schema({
    test: { type: 'ObjectId', ref: 'TestSubmission', required: true },
    question: { type: 'ObjectId', ref: 'Question', required: true },
    optionsChosen: [{ type: 'ObjectId', ref: 'Option' }],
    feedback: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('../interfaces/testAnswer').ITestAnswerModel}
 */
const TestAnswer = mongoose.model('TestAnswer', testAnswerSchema);

module.exports = TestAnswer;
