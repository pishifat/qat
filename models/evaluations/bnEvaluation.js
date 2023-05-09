const mongoose = require('mongoose');
const Evaluation = require('./evaluation');

const bnEvaluationSchema = new mongoose.Schema({
    consensus: { type: String, enum: ['fullBn', 'probationBn', 'removeFromBn', 'remainInNat', 'moveToBn', 'removedFromNat'] }, // last 3 are only for NAT evals. which are mechanically BN evals. it's bad i know.
    deadline: { type: Date , required: true },
    addition: { type: String, enum: ['lowActivityWarning', 'behaviorWarning', 'mapQualityWarning', 'moddingQualityWarning', 'none'] },
    activityToCheck: { type: Number },
    selfSummary: { type: 'ObjectId', ref: 'Note' }, // only used for NAT evals
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

bnEvaluationSchema.virtual('isBnEvaluation').get(function () {
    return true;
});

/**
 * @type {import('../interfaces/evaluations').IBnEvaluationModel}
 */
const BnEvaluation = Evaluation.discriminator('currentBn', bnEvaluationSchema);

module.exports = BnEvaluation;
