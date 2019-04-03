const mongoose = require('mongoose');
const BaseService = require('./baseService');

const mediationSchema = new mongoose.Schema({
    mediator: { type: 'ObjectId', ref: 'User', required: true },
    comment: { type: String },
    vote: { type: Number, enum: [1, 2, 3] }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Mediation = mongoose.model('Mediation', mediationSchema);

class MediationService extends BaseService
{
    constructor() {
        super(Mediation);
    }

    /**
     * 
     * @param {object} mediatorId UserId who mediates
     * @param {string} comment 
     * @param {number} vote 
     */
    async create(mediatorId) {
        try {
            return await Mediation.create({mediator: mediatorId});
        } catch(error) {
            return { error: error._message }
        }
    }
}

const service = new MediationService();

module.exports = { service, Mediation };