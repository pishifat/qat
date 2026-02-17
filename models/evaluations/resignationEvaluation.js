const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const resignationEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['resignedOnGoodTerms', 'resignedOnStandardTerms'] },
    deadline: { type: Date , required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

resignationEvaluationSchema.virtual('isResignation').get(function () {
    return true;
});

/*
    * in march 2024, the evaluation message changed to show evaluator's individual comments, but not attach their names
    * this bool is needed to identify said evaluations
*/
resignationEvaluationSchema.virtual('isNewEvaluationFormat').get(function () {
    const newEvaluationFormatCutoff = new Date('2024-03-25');

    return new Date(this.archivedAt || this.createdAt) > newEvaluationFormatCutoff;
});

/**
 * @type {import('../interfaces/evaluations').IResignationEvaluationModel}
 */
const ResignationEvaluation = Evaluation.discriminator('resignation', resignationEvaluationSchema);

module.exports = ResignationEvaluation;
