const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const beatmapReportSchema = new mongoose.Schema({
    beatmapsetId: { type: Number, required: true },
    postId: { type: Number, required: true },
    reporterUserId: { type: Number, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const BeatmapReport = mongoose.model('BeatmapReport', beatmapReportSchema);

class BeatmapReportService extends BaseService
{
    constructor() {
        super(BeatmapReport);
    }

    /**
     * 
     * @param {number} beatmapsetId
     * @param {number} postId 
     * @param {number} reporterUserId 
     */
    async create(beatmapsetId, postId, reporterUserId) {
        try {
            return await BeatmapReport.create({ beatmapsetId, postId, reporterUserId });
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }
}

const service = new BeatmapReportService();

module.exports = { service, BeatmapReport };