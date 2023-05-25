const mongoose = require('mongoose');

const vetoesSchema = new mongoose.Schema({
    vetoer: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    reasons: [{
        _id: false,
        link: { type: String, required: true },
        summary: { type: String, required: true },
    }],
    beatmapId: { type: Number },
    beatmapTitle: { type: String },
    beatmapMapper: { type: String },
    beatmapMapperId: { type: Number },
    status: { type: String, enum: ['available', 'wip', 'archive'], default: 'available' },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    deadline: { type: Date },
    vetoFormat: { type: Number },
        /*
            1 = og (no longer used)
            2 = multi-reason vetoes (no longer used)
            3 = no more "partially agree" (default veto)
            4 = re-mediation (2 week deadline + all bns are selected)
        */
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/veto').default}
 */
const Veto = mongoose.model('Veto', vetoesSchema);

module.exports = Veto;
