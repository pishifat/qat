const mongoose = require('mongoose');

const beatmapReportSchema = new mongoose.Schema({
    beatmapsetId: { type: Number, required: true },
    postId: { type: Number, required: true },
    reporterUserId: { type: Number, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const BeatmapReport = mongoose.model('BeatmapReport', beatmapReportSchema);

module.exports = BeatmapReport;
