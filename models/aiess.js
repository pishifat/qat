const mongoose = require('mongoose');
const BaseService = require('./baseService');

const aiessSchema = new mongoose.Schema({
    beatmapsetId: { type: Number },
    userId: { type: Number },
    metadata: { type: String },
    modes: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'] }],
    eventType: { type: String, enum: ['Bubbled', 'Qualified', 'Disqualified', 'Popped', 'Ranked'] },
    content: { type: String },
    timestamp: { type: Date },

    valid: { type: Number, enum: [1, 2, 3] },
    mapperId: { type: Number },
    mapperTotalRanked: { type: Number },
    isBnOrNat:  { type: Boolean, default: false },
    isUnique: { type: Boolean, default: false },
    effortBonus: { type: Number }, //multiplier combining drain per diff, # diffs, and difficulty of each diff
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Aiess = mongoose.model('aiess', aiessSchema, 'aiess');

class AiessService extends BaseService
{
    constructor() {
        super(Aiess);
    }

    /**
     * 
     * @param {object} osuId 
     */
    async create(osuId) {
        try {
            return await Aiess.create({userId: osuId});
        } catch(error) {
            return { error: error._message }
        }
    }

    /**
     * Group all data by event
     * @param {date} limitDate 
     * @param {string} mode 
     */
    async getAllByEventType(limitDate, mode) {
        if (!limitDate && !mode) return null;

        try {
            return await Aiess.aggregate([
                { 
                    $match: {
                        $or: [
                            { eventType: 'Disqualified' },
                            { eventType: 'Popped' },
                        ],
                        timestamp: { $gte: limitDate },
                        modes: mode
                    } 
                },
                {
                    $sort: {
                        timestamp: 1,
                        beatmapsetId: -1,
                    }
                },
                {
                    $group: {
                        _id: '$eventType', events: { $push: '$$ROOT' }
                    }
                },
            ]);
        } catch (error) {            
            return { error: error._message };
        }
    }
    
    /**
     * Group data of a user by event
     * @param {number} userId 
     * @param {date} limitDate 
     * @param {string} mode 
     */
    async getByEventTypeAndUser(userId, limitDate, mode) {
        if (!userId && !limitDate && !mode) return null;

        try {
            return await Aiess.aggregate([
                { 
                    $match: { 
                        userId: userId,
                        timestamp: { $gte: limitDate },
                        eventType: { $ne: 'Ranked' },
                        modes: mode
                    } 
                },
                {
                    $sort: {
                        timestamp: 1,
                        beatmapsetId: -1,
                    }
                },
                {
                    $group: {
                        _id: '$eventType', events: { $push: '$$ROOT' }
                    }
                },
            ]);
        } catch (error) {            
            return { error: error._message };
        }
    }
}

const service = new AiessService();

module.exports = { service, Aiess };