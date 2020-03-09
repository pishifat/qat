const mongoose = require('mongoose');

const bnAppSchema = new mongoose.Schema({
    applicant: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    mods: [{ type: String, required: true }],
    reasons: [{ type: String, required: true }],
    evaluations: [{ type: 'ObjectId', ref: 'Evaluation' }],
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    consensus: { type: String, enum: ['pass', 'fail'] },
    feedback: { type: String },
    feedbackAuthor: { type: 'ObjectId', ref: 'User' },
    test: { type: 'ObjectId', ref: 'TestSubmission' },
    bnEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    natEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    cooldownDate: { type: Date },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


class BnAppService
{

    static findActiveApps() {
        return BnApp
            .find({ active: true })
            .populate([
                { path: 'applicant', select: 'username osuId' },
                { path: 'bnEvaluators', select: 'username osuId' },
                { path: 'natEvaluators', select: 'username osuId' },
                { path: 'test', select: 'totalScore comment' },
                {
                    path: 'evaluations',
                    select: 'evaluator behaviorComment moddingComment vote',
                    populate: {
                        path: 'evaluator',
                        select: 'username osuId group',
                    },
                },
            ])
            .sort({ deadline: 1 });
    }

}

bnAppSchema.loadClass(BnAppService);
const BnApp = mongoose.model('BnApp', bnAppSchema);

module.exports = BnApp;
