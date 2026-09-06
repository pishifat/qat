const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    type: {
        type: String,
        enum: ['mappingQuality', 'moddingQuality', 'behavior', 'other'],
        required: true,
    },
    severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'severe'],
        required: true,
    },
    reason: { type: String, required: true },
    createdBy: { type: 'ObjectId', ref: 'User', required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

penaltySchema.index({ user: 1, mode: 1, createdAt: -1 });
penaltySchema.index({ user: 1, type: 1 });

/**
 * @type {import('./interfaces/penalty').default}
 */
const Penalty = mongoose.model('Penalty', penaltySchema);

module.exports = Penalty;
