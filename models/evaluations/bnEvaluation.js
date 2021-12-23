const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const bnEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['fullBn', 'probationBn', 'removeFromBn'] },
    deadline: { type: Date , required: true },
    addition: { type: String, enum: ['lowActivityWarning', 'behaviorWarning', 'mapQualityWarning', 'moddingQualityWarning', 'none'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

bnEvaluationSchema.virtual('isBnEvaluation').get(function () {
    return true;
});

/**
 * @type {import('../interfaces/evaluations').IBnEvaluationModel}
 */
const BnEvaluation = Evaluation.discriminator('currentBn', bnEvaluationSchema);

module.exports = BnEvaluation;
