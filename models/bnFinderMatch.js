const mongoose = require('mongoose');

const bnFinderMatchSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    isMatch: { type: Boolean },
    isExpired: { type: Boolean },
    beatmapset: { type: 'ObjectId', ref: 'Beatmapset', required: true },
    genres: [{ type: String }],
    languages: [{ type: String }],
    styles: [{ type: String }],
    details: [{ type: String }],
    mapperExperience: { type: String },
    isPostponed: { type: Boolean },
    messagingEnabled: { type: Boolean },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/bnFinderMatch').default}
 */
const BnFinderMatch = mongoose.model('BnFinderMatch', bnFinderMatchSchema);

module.exports = BnFinderMatch;