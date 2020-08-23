const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const bnEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['fullBn', 'probationBn', 'removeFromBn'] },
    deadline: { type: Date , required: true },
    addition: { type: String, enum: ['lowActivity', 'none'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

/**
 * @type {import('../interfaces/evaluations').IBnEvaluationModel}
 */
const BnEvaluation = Evaluation.discriminator('BnEvaluation', bnEvaluationSchema);

module.exports = BnEvaluation;
