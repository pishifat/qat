const mongoose = require('mongoose');
const baseSchema = require('./base');

const resignationEvaluationSchema = new mongoose.Schema({
    ...baseSchema,
    consensus: { type: String, enum: ['resignedOnGoodTerms', 'resignedOnStandardTerms'] },
    deadline: { type: Date , required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class ResignationEvaluationService {

    get kind () {
        return 'resignation';
    }

    static findActiveResignations() {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        return ResignationEvaluation
            .find({
                active: true,
                deadline: { $lte: minDate },
            })
            .populate([
                {
                    path: 'user',
                    select: 'username osuId modesInfo groups',
                },
                {
                    path: 'natEvaluators',
                    select: 'username osuId',
                },
                {
                    path: 'reviews',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId groups',
                    },
                },
            ])
            .sort({ deadline: 1, consensus: 1, feedback: 1 });
    }
}

resignationEvaluationSchema.loadClass(ResignationEvaluationService);
/**
 * @type {import('../interfaces/evaluations').IResignationEvaluationModel}
 */
const ResignationEvaluation = mongoose.model('resignation', resignationEvaluationSchema);

module.exports = ResignationEvaluation;
