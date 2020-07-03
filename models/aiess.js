const mongoose = require('mongoose');

const aiessSchema = new mongoose.Schema({
    beatmapsetId: { type: Number },
    userId: { type: Number },
    postId: { type: Number },
    metadata: { type: String },
    modes: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'] }],
    eventType: { type: String, enum: ['Bubbled', 'Qualified', 'Disqualified', 'Popped', 'Ranked', 'Reported'] },
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
    qualityAssuranceComments: [{ type: 'ObjectId', ref: 'Mediation' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class AiessService extends mongoose.Model
{

    /**
     * Get unique events from an user
     * @param {number} userId
     * @param {Date} minDate
     * @param {Date} maxDate
     * @param {array} modes
     * @param {array} eventTypes
     * @returns {mongoose.Aggregate} aggregation query
     */
    static getUniqueUserEvents (userId, minDate, maxDate, modes, eventTypes) {
        const aggregation = this.getUserEvents(userId, minDate, maxDate, modes, eventTypes);

        aggregation
            .group({
                _id: '$beatmapsetId',
                event: { $first: '$$ROOT' },
            })
            .replaceRoot('event')
            .sort({
                timestamp: 1,
            });

        return aggregation;
    }

    /**
     * Get all the specified events from an user
     * @param {number} userId
     * @param {Date} minDate
     * @param {Date} maxDate
     * @param {array} modes
     * @param {array} eventTypes
     * @returns {mongoose.Aggregate} aggregation query
     */
    static getUserEvents (userId, minDate, maxDate, modes, eventTypes) {
        return this.aggregate([
            {
                $match: {
                    userId,
                    eventType: {
                        $in: eventTypes,
                    },
                    $and: [
                        { timestamp: { $gte: minDate } },
                        { timestamp: { $lte: maxDate } },
                    ],
                    modes: { $in: modes },
                },
            },
            {
                $sort: {
                    timestamp: 1,
                    beatmapsetId: -1,
                },
            },
        ]);
    }

    /**
     * Get all the specified events from an user related to a group of beatmapsets
     * @param {number} userId
     * @param {array} beatmapsetIds
     * @param {Date} minDate
     * @param {Date} maxDate
     * @param {array} modes
     * @param {string} eventType
     * @returns {object} aggregation query
     */
    static getRelatedBeatmapsetEvents (userId, beatmapsetIds, minDate, maxDate, modes, eventType) {
        const aggregation = this.aggregate([
            {
                $match: {
                    userId: { $ne: userId },
                    beatmapsetId: {
                        $in: beatmapsetIds,
                    },
                    eventType,
                    $and: [
                        { timestamp: { $gte: minDate } },
                        { timestamp: { $lte: maxDate } },
                    ],
                    modes: { $in: modes },
                },
            },
            {
                $sort: {
                    timestamp: 1,
                    beatmapsetId: -1,
                },
            },
        ]);

        return aggregation;
    }

    /**
     * Group all data by event without mode and including nominations
     * @param {Date} minDate
     * @param {Date} maxDate
     * @param {string} mode
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
}

aiessSchema.loadClass(AiessService);
/**
 * @type {import('./interfaces/aiess').IAiessModel}
 */
const Aiess = mongoose.model('aiess', aiessSchema, 'aiess');

module.exports = Aiess;
