const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    title: { type: String, required: true },
    discussionLink: { type: String },
    shortReason: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isNatOnly: { type: Boolean, default: false },
    neutralAllowed: { type: Boolean, default: true },
    reasonAllowed: { type: Boolean, default: false },
    isContentReview: { type: Boolean },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    creator: { type: 'ObjectId', ref: 'User' },
    isHidden: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/discussion').default}
 */
const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
