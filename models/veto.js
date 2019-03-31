const mongoose = require('mongoose');
const BaseService = require('./baseService');

const vetoesSchema = new mongoose.Schema({
    sender: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'] },
    beatmapLink: { type: String, required: true },
    beatmapId: { type: String },
    beatmapTitle: { type: String },
    beatmapMapper: { type: String },
    reasonLink: { type: String, required: true },
    status: { type: String, enum: ['available', 'wip', 'upheld', 'withdrawn'], default: 'available' },
    debaters: [{ type: 'ObjectId', ref: 'User' }],
    mediator: { type: 'ObjectId', ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

vetoesSchema.pre('findByIdAndUpdate', function (next) {
    this.populate('mediator', 'username osuId');
    this.populate('debaters', 'username osuId');
    next();
});

const Veto = mongoose.model('Veto', vetoesSchema);

class VetoService extends BaseService
{
    constructor() {
        super(Veto);
    }

    /**
     * 
     * @param {object} sender UserId who creates
     * @param {string} beatmapLink 
     * @param {number} beatmapId 
     * @param {string} beatmapTitle 
     * @param {string} beatmapMapper 
     * @param {string} reasonLink 
     * @param {string} mode 'osu', 'taiko', 'catch', 'mania'
     */
    async create(sender, beatmapLink, beatmapId, beatmapTitle, beatmapMapper, reasonLink, mode) {
        try {
            return await Veto.create({ 
                sender: sender, 
                beatmapLink: beatmapLink, 
                beatmapId: beatmapId, 
                beatmapTitle: beatmapTitle, 
                beatmapMapper: beatmapMapper,
                reasonLink: reasonLink, 
                mode: mode 
            });
        } catch(error) {
            return { error: 'could not create veto' }
        }
    }
}

const service = new VetoService();

module.exports = { service, Veto };