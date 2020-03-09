const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    title: { type: String, required: true },
    discussionLink: { type: String },
    shortReason: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    isNatOnly: { type: Boolean, default: false },
    creator: { type: 'ObjectId', ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
