const baseSchema = {
    user: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    reviews: [{ type: 'ObjectId', ref: 'Review' }],
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    isReviewed: { type: Boolean, default: false },
    isSecurityChecked: { type: Boolean, default: false },
    feedback: { type: String },
    cooldownDate: { type: Date },
    natEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    bnEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    mockEvaluators: [{ type: 'ObjectId', ref: 'User' }],
    archivedAt: { type: Date },
    isPublic: { type: Boolean },
    messages: [{
        _id: false,
        date: { type: Date, required: true },
        content: { type: String, required: true },
        isNat: { type: Boolean, required: true },
    }],
    messagesLocked: { type: Boolean },
    rerolls: [{
        _id: false,
        createdAt: { type: Date, required: true },
        oldEvaluator: { type: 'ObjectId', ref: 'User' },
        newEvaluator: { type: 'ObjectId', ref: 'User', required: true },
        type: { type: String, enum: ['automatic', 'manual'] },
    }],
    mockReviews: [{ type: 'ObjectId', ref: 'Review' }],
};

module.exports = baseSchema;
