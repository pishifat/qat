const baseSchema = {
    user: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    reviews: [{ type: 'ObjectId', ref: 'Review' }],
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    isReviewed: { type: Boolean, default: false },
    isSecurityChecked: { type: Boolean, default: false },
    feedback: { type: String },
    hasCooldown: { type: Boolean },
    cooldownDate: { type: Date },
    natEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    bnEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    archivedAt: { type: Date },
    natEvaluatorHistory: [{
        _id: false,
        date: { type: Date, required: true },
        user: { type: 'ObjectId', ref: 'User', required: true },
        previousUser: { type: 'ObjectId', ref: 'User' },
        daysOverdue: { type: Number, required: true },
    }],
    overwriteNextEvaluationDate: { type: Date },
};

module.exports = baseSchema;
