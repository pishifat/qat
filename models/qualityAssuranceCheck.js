const mongoose = require('mongoose');

const qualityAssuranceCheckSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    event: { type: 'ObjectId', ref: 'aiess', required: true },
    comment: { type: String },
    timestamp: { type: Date, required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/qualityAssuranceCheck').default}
 */
const QualityAssuranceCheck = mongoose.model('QualityAssuranceCheck', qualityAssuranceCheckSchema);

module.exports = QualityAssuranceCheck;
