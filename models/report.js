const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: { type: 'ObjectId', ref: 'User', required: true },
    culprit: { type: 'ObjectId', ref: 'User' },
    link: { type: String },
    reason: { type: String, required: true },
    display: { type: Boolean, default: true },
    valid: { type: Number, enum: [1, 2, 3] },
    feedback: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
