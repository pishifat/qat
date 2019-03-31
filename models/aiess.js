const mongoose = require('mongoose');
const BaseService = require('./baseService');

const aiessSchema = new mongoose.Schema({
    beatmapsetId: { type: Number },
    userId: { type: Number },
    metadata: { type: String },
    eventType: { type: String },
    content: { type: String },
    timestamp: { type: Date },
    valid: { type: Number, enum: [1, 2, 3] }
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
    
}

const service = new AiessService();

module.exports = { service, Aiess };