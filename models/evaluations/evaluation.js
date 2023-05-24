const mongoose = require('mongoose');
const baseSchema = require('./base');
const Settings = require('../settings');
const User = require('../user');

const evaluationSchema = new mongoose.Schema({
    ...baseSchema,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, discriminatorKey: 'kind' });

class EvaluationService extends mongoose.Model {

    static async findActiveEvaluations(mongoId, isNat) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        let query;

        if (isNat) {
            query = {
                active: true,
                deadline: { $lte: minDate },
            }
        } else {
            const [settings, user] = await Promise.all([
                Settings.findOne({}), // there's only one
                User.findById(mongoId),
            ]);

            const trialNatEnabledModeSettings = settings.modeSettings.filter(s => s.hasTrialNat == true);
            const trialNatModes = trialNatEnabledModeSettings.map(s => s.mode);

            query = {
                active: true,
                deadline: { $lte: minDate },
                user: { $ne: mongoId },
                $and: [
                    { mode: user.modes },
                    { mode: trialNatModes },
                ]
            }
        }

        return this
            .find(query)
            .populate([
                {
                    path: 'user',
                    select: 'username osuId modesInfo groups evaluatorModes',
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
                    path: 'reviews',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId groups',
                    },
                },
                {
                    path: 'selfSummary',
                },
            ])
            .sort({ deadline: 1, consensus: 1, feedback: 1 });
    }

    static findInactiveEvaluations() {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        return this
            .find({
                active: true,
                deadline: { $gte: minDate },
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

    static deleteUserActiveEvaluations(userId, mode) {
        let minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);

        return this.deleteMany({
            user: userId,
            active: true,
            deadline: { $gte: minDate },
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
