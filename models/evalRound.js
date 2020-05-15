const mongoose = require('mongoose');

const evalRoundSchema = new mongoose.Schema({
    bn: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    evaluations: [{ type: 'ObjectId', ref: 'Evaluation' }],
    deadline: { type: Date , required: true },
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    consensus: { type: String, enum: ['pass', 'probation', 'fail'] },
    feedback: { type: String },
    feedbackAuthor: { type: 'ObjectId', ref: 'User' },
    isLowActivity: { type: Boolean, default: false },
    resignedOnGoodTerms: { type: Boolean, default: false },
    resignedOnStandardTerms: { type: Boolean, default: false },
    isMoveToNat: { type: Boolean, default: false },
    isMoveToBn: { type: Boolean, default: false },
    cooldownDate: { type: Date },
    natEvaluators: [{ type: 'ObjectId', ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class EvalRoundService
{

    static findActiveEvaluations() {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        return EvalRound
            .find({
                active: true,
                deadline: { $lte: minDate },
            })
            .populate([
                {
                    path: 'bn',
                    select: 'username osuId probation modes group',
                },
                {
                    path: 'natEvaluators',
                    select: 'username osuId',
                },
                {
                    path: 'evaluations',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId group',
                    },
                },
            ])
            .sort({ deadline: 1, consensus: 1, feedback: 1 });
    }

    static deleteManyByUserId(userId) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);

        return EvalRound.deleteMany({
            bn: userId,
            active: true,
            deadline: { $gte: minDate },
        });
    }

}

evalRoundSchema.loadClass(EvalRoundService);
const EvalRound = mongoose.model('EvalRound', evalRoundSchema);

module.exports = EvalRound;
