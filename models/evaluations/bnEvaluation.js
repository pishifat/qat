const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const bnEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['fullBn', 'probationBn', 'removeFromBn', 'remainInNat', 'moveToBn', 'removeFromNat'] }, // last 3 are only for NAT evals. which are mechanically BN evals. it's bad i know.
    deadline: { type: Date , required: true },
    addition: { type: String, enum: ['lowActivityWarning', 'behaviorWarning', 'mapQualityWarning', 'moddingQualityWarning', 'none'] },
    activityToCheck: { type: Number },
    selfSummary: { type: 'ObjectId', ref: 'Note' }, // only used for NAT evals
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

bnEvaluationSchema.virtual('isBnEvaluation').get(function () {
    return true;
});

/*
    * in march 2024, the evaluation message changed to show evaluator's individual comments, but not attach their names
    * this bool is needed to identify said evaluations
*/
bnEvaluationSchema.virtual('isNewEvaluationFormat').get(function () {
    const newEvaluationFormatCutoff = new Date('2024-03-25');

    return new Date(this.archivedAt || this.createdAt) > newEvaluationFormatCutoff;
});

bnEvaluationSchema.virtual('isNatEvaluation').get(function () {
    return this.consensus === 'remainInNat' || this.consensus === 'moveToBn' || this.consensus === 'removeFromNat';
});

/**
 * @type {import('../interfaces/evaluations').IBnEvaluationModel}
 */
const BnEvaluation = Evaluation.discriminator('currentBn', bnEvaluationSchema);

module.exports = BnEvaluation;
