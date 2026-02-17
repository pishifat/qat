const mongoose = require('mongoose');
const baseSchema = require('./base');
const Settings = require('../settings');

const evaluationSchema = new mongoose.Schema({
    ...baseSchema,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

class EvaluationService extends mongoose.Model {

    static async findActiveEvaluations(user, isNat, isTrialNat) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        let query;
        let populate = [
            {
                path: 'user',
                select: 'username osuId modesInfo groups evaluatorModes subjectiveEvalFeedback history',
            },
            {
                path: 'natBuddy',
                select: 'username osuId',
            },
            {
                path: 'natEvaluators',
                select: 'username osuId discordId isBnEvaluator',
            },
            {
                path: 'bnEvaluators',
                select: 'username osuId discordId isBnEvaluator',
            },
            {
                path: 'mockEvaluators',
                select: 'username osuId discordId isBnEvaluator',
            },
            {
                path: 'reviews',
                select: 'evaluator behaviorComment moddingComment vote',
                populate: {
                    path: 'evaluator',
                    select: 'username osuId groups discordId isBnEvaluator',
                },
            },
            {
                path: 'mockReviews',
                select: 'evaluator behaviorComment moddingComment vote',
                populate: {
                    path: 'evaluator',
                    select: 'username osuId groups discordId isBnEvaluator',
                },
            },
            {
                path: 'rerolls',
                populate: [
                    {
                        path: 'oldEvaluator',
                        select: 'username osuId',
                    },
                    {
                        path: 'newEvaluator',
                        select: 'username osuId',
                    },
                ],
            },
        ];

        if (isNat) {
            query = {
                active: true,
                deadline: { $lt: minDate },
            };

            populate.push(
                {
                    path: 'selfSummary',
                }
            );
        } else if (isTrialNat) {
            const settings = await Settings.findOne({}); // there's only one
            const trialNatEnabledModeSettings = settings.modeSettings.filter(s => s.hasTrialNat == true);
            const trialNatModes = trialNatEnabledModeSettings.map(s => s.mode);

            query = {
                active: true,
                deadline: { $lt: minDate },
                user: { $ne: user._id },
                $and: [
                    { mode: user.modes },
                    { mode: trialNatModes },
                ],
            };
        } else {
            // technically this means the function loads inactive evals but i dont care
            query = {
                $or: [
                    { active: true, discussion: false },
                    { active: false, discussion: true },
                ],

                deadline: { $lt: minDate },
                user: { $ne: user._id },
                mode: user.modes,
                mockEvaluators: user._id,
            };
        }

        return this
            .find(query)
            .populate(populate)
            .sort({ deadline: 1, consensus: 1, feedback: 1 });
    }

    static findInactiveEvaluations() {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        return this
            .find({
                active: true,
                deadline: { $gt: minDate },
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
                    path: 'bnEvaluators',
                    select: 'username osuId',
                },
                {
                    path: 'mockEvaluators',
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
                {
                    path: 'mockReviews',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId groups discordId isBnEvaluator',
                    },
                },
            ])
            .sort({ deadline: 1, consensus: 1, feedback: 1 });
    }

    static deleteUserActiveEvaluations(userId, mode) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        return this.deleteMany({
            user: userId,
            active: true,
            deadline: { $gt: minDate },
            mode,
        });
    }

}

evaluationSchema.loadClass(EvaluationService);
/**
 * @type {import('../interfaces/evaluations').IEvaluationModel}
 */
const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
