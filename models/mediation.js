const mongoose = require('mongoose');

const mediationSchema = new mongoose.Schema({
    mediator: { type: 'ObjectId', ref: 'User', required: true },
    comment: { type: String },
    vote: { type: Number, enum: [1, 2, 3] },
    reasonIndex: { type: Number },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/mediation').IMediationModel}
 */
const Mediation = mongoose.model('Mediation', mediationSchema);

module.exports = Mediation;
