const config = require('../config.json');
const mongoose = require('mongoose');
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true })

const aiessSchema = new mongoose.Schema({
    beatmapsetId: { type: Number },
    userId: { type: Number },
    metadata: { type: String },
    eventType: { type: String },
    content: { type: String },
    timestamp: { type: Date },
    valid: { type: Number, enum: [1, 2, 3] }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Aiess = db.model('aiess', aiessSchema, 'aiess');

class AiessService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = Aiess.find(params);
        } else {
            query = Aiess.findOne(params);
        }

        if (populate) {
            for (let i = 0; i < populate.length; i++) {
                const p = populate[i];
                
                if (p.innerPopulate) {
                    query.populate({ path: p.innerPopulate, model: p.model, populate: p.populate });
                } else {
                    query.populate(p.populate, p.display, p.model);
                }
            }
        }

        if (sorting) {
            query.sort(sorting);
        }

        try {
            return await query.exec();
        } catch(error) {
            return { error: error._message };
        }
    }

    
    async update(id, update) {
        try {
            return await Aiess.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

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