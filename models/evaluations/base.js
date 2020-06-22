const baseSchema = {
    user: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    reviews: [{ type: 'ObjectId', ref: 'Review' }],
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    feedback: { type: String },
    cooldownDate: { type: Date },
    natEvaluators: [{ type: 'ObjectId', ref: 'User' }],
};

module.exports = baseSchema;
