const mongoose = require('mongoose');

const userRiskSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    score: { type: Number, required: true },
    level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    limitedHistory: { type: Boolean, default: false },
    calculatedAt: { type: Date, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, collection: 'userrisks' });

userRiskSchema.index({ user: 1, mode: 1 }, { unique: true });
userRiskSchema.index({ mode: 1, score: -1 });

/**
 * @type {import('./interfaces/userRisk').default}
 */
const UserRisk = mongoose.model('UserRisk', userRiskSchema);

module.exports = UserRisk;
