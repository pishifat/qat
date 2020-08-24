const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const resignationEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['resignedOnGoodTerms', 'resignedOnStandardTerms'] },
    deadline: { type: Date , required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

resignationEvaluationSchema.virtual('isResignation').get(function () {
    return true;
});

/**
 * @type {import('../interfaces/evaluations').IResignationEvaluationModel}
 */
const ResignationEvaluation = Evaluation.discriminator('resignation', resignationEvaluationSchema);

module.exports = ResignationEvaluation;
