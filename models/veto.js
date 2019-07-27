const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const vetoesSchema = new mongoose.Schema({
    vetoer: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    discussionLink: { type: String, required: true },
    beatmapId: { type: String },
    beatmapTitle: { type: String },
    beatmapMapper: { type: String },
    beatmapMapperId: { type: Number },
    shortReason: { type: String, required: true },
    status: { type: String, enum: ['available', 'wip', 'upheld', 'withdrawn'], default: 'available' },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    deadline: { type: Date },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

vetoesSchema.pre('findByIdAndUpdate', function (next) {
    //this.populate('mediators', 'username osuId');
    this.populate('vetoer', 'username osuId');
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
     * @param {object} vetoer UserId who creates
     * @param {string} discussionLink 
     * @param {number} beatmapId 
     * @param {string} beatmapTitle 
     * @param {string} beatmapMapper 
     * @param {string} shortReason 
     * @param {string} mode 'osu', 'taiko', 'catch', 'mania'
     */
    async create(vetoer, discussionLink, beatmapId, beatmapTitle, beatmapMapper, beatmapMapperId, shortReason, mode) {
        try {
            return await Veto.create({ 
                vetoer: vetoer, 
                discussionLink: discussionLink, 
                beatmapId: beatmapId, 
                beatmapTitle: beatmapTitle, 
                beatmapMapper: beatmapMapper,
                beatmapMapperId: beatmapMapperId,
                shortReason: shortReason, 
                mode: mode 
            });
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: 'could not create veto' };
        }
    }
}

const service = new VetoService();

module.exports = { service, Veto };