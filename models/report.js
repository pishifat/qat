const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: { type: 'ObjectId', ref: 'User', required: true },
    culprit: { type: 'ObjectId', ref: 'User' },
    link: { type: String },
    reason: { type: String, required: true },
    valid: { type: Number, enum: [1, 2, 3] },
    feedback: { type: String },
    isActive: { type: Boolean, default: true },
    category: { type: String, enum: ['stolenBeatmap', 'contentCaseSong', 'contentCaseVisual', 'behavior', 'other'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/report').default}
 */
const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
