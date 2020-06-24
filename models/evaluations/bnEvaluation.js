const mongoose = require('mongoose');
const baseSchema = require('./base');

const bnEvaluationSchema = new mongoose.Schema({
    ...baseSchema,
    consensus: { type: String, enum: ['pass', 'probation', 'fail'] },
    deadline: { type: Date , required: true },
    isLowActivity: { type: Boolean, default: false },
    resignedOnGoodTerms: { type: Boolean, default: false },
    resignedOnStandardTerms: { type: Boolean, default: false },
    isMoveToNat: { type: Boolean, default: false },
    isMoveToBn: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class BnEvaluationService {

    get kind () {
        return 'currentBn';
    }

    static findActiveEvaluations() {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        return BnEvaluation
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

    static deleteUserActiveEvaluations(userId) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        return BnEvaluation.deleteMany({
            user: userId,
            active: true,
            deadline: { $gte: minDate },
        });
    }

}

bnEvaluationSchema.loadClass(BnEvaluationService);
const BnEvaluation = mongoose.model('EvalRound', bnEvaluationSchema);

module.exports = BnEvaluation;
