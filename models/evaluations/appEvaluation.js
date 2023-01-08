const mongoose = require('mongoose');
const baseSchema = require('./base');

const appEvaluationSchema = new mongoose.Schema({
    ...baseSchema,
    consensus: { type: String, enum: ['pass', 'fail'] },
    mods: [{ type: String, required: true }],
    reasons: [{ type: String, required: true }],
    test: { type: 'ObjectId', ref: 'TestSubmission' },
    isRejoinRequest: { type: Boolean },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class AppEvaluationService extends mongoose.Model {

    get isApplication () {
        return true;
    }

    get deadline () {
        let delay = this.isRejoinRequest ? 1 : this.discussion ? 14 : 7;
        let createdAt = this.createdAt;

        return new Date(createdAt.setDate(createdAt.getDate() + delay));
    }

    get kind () {
        return 'application';
    }

    static findActiveApps() {
        return AppEvaluation
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate([
                { path: 'user', select: 'username osuId' },
                { path: 'bnEvaluators', select: 'username osuId' },
                { path: 'natEvaluators', select: 'username osuId' },
                { path: 'test', select: 'totalScore comment' },
                {
                    path: 'reviews',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId groups',
                    },
                },
            ])
            .sort({
                createdAt: 1,
                consensus: 1,
                feedback: 1,
            });
    }

}

appEvaluationSchema.loadClass(AppEvaluationService);
/**
 * @type {import('../interfaces/evaluations').IAppEvaluationModel}
 */
const AppEvaluation = mongoose.model('AppEvaluation', appEvaluationSchema);

module.exports = AppEvaluation;
