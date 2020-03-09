const mongoose = require('mongoose');

const aiessSchema = new mongoose.Schema({
    beatmapsetId: { type: Number },
    userId: { type: Number },
    postId: { type: Number },
    metadata: { type: String },
    modes: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'] }],
    eventType: { type: String, enum: ['Bubbled', 'Qualified', 'Disqualified', 'Popped', 'Ranked'] },
    content: { type: String },
    timestamp: { type: Date },
    hostId: { type: Number },
    hostName: { type: String },

    valid: { type: Number, enum: [1, 2, 3] },
    obviousness: { type: Number, default: null },
    severity: { type: Number, default: null },
    mapperId: { type: Number },
    mapperTotalRanked: { type: Number },
    isBnOrNat: { type: Boolean, default: false },
    isUnique: { type: Boolean, default: false },
    effortBonus: { type: Number }, //multiplier combining drain per diff, # diffs, and difficulty of each diff
    responsibleNominators: [{ type: Number }],
    qualityAssuranceCheckers: [{ type: 'ObjectId', ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class AiessService
{

    /**
     * Group all data by event
     * @param {date} minDate
     * @param {date} maxDate
     * @param {string} mode
     */
    static async getAllByEventType(minDate, maxDate, mode) {
        if (!minDate && !maxDate && !mode) return null;

        try {
            return await this.aggregate([
                {
                    $match: {
                        $or: [
                            { eventType: 'Disqualified' },
                            { eventType: 'Popped' },
                            { eventType: 'Reported' },
                        ],
                        $and: [
                            { timestamp: { $gte: minDate } },
                            { timestamp: { $lte: maxDate } },
                        ],
                        modes: mode,
                    },
                },
                {
                    $sort: {
                        timestamp: 1,
                        beatmapsetId: -1,
                    },
                },
                {
                    $group: {
                        _id: '$eventType', events: { $push: '$$ROOT' },
                    },
                },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

    /**
     * Group all data by event without mode and including nominations
     * @param {date} minDate
     * @param {date} maxDate
     */
    static async getAllActivity(minDate, maxDate, mode) {
        if (!minDate && !maxDate) return null;

        try {
            return await this.aggregate([
                {
                    $match: {
                        $and: [
                            { timestamp: { $gte: minDate } },
                            { timestamp: { $lte: maxDate } },
                        ],
                        eventType: { $ne: 'Ranked' },
                        modes: mode,
                    },
                },
                {
                    $sort: {
                        timestamp: 1,
                        beatmapsetId: -1,
                    },
                },
                {
                    $group: {
                        _id: '$eventType', events: { $push: '$$ROOT' },
                    },
                },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

    /**
     * Group data of a user by event
     * @param {number} userId
     * @param {date} minDate
     * @param {date} maxDate
     * @param {string} mode
     */
    static async getByEventTypeAndUser(userId, minDate, maxDate, mode) {
        if (!userId && !minDate && !maxDate && !mode) return null;

        try {
            return await this.aggregate([
                {
                    $match: {
                        userId,
                        $and: [
                            { timestamp: { $gte: minDate } },
                            { timestamp: { $lte: maxDate } },
                        ],
                        eventType: { $ne: 'Ranked' },
                        modes: mode,
                    },
                },
                {
                    $sort: {
                        timestamp: 1,
                        beatmapsetId: -1,
                    },
                },
                {
                    $group: {
                        _id: '$eventType', events: { $push: '$$ROOT' },
                    },
                },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }
}

aiessSchema.loadClass(AiessService);
const Aiess = mongoose.model('aiess', aiessSchema, 'aiess');

module.exports = Aiess;
