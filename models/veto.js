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
    status: { type: String, enum: ['available', 'wip', 'upheld', 'withdrawn'], default: 'available' },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    deadline: { type: Date },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/veto').default}
 */
const Veto = mongoose.model('Veto', vetoesSchema);

module.exports = Veto;
