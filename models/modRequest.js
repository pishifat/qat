const mongoose = require('mongoose');

const modRequestsSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    category: { type: String, enum: ['simple', 'tech', 'doubleBpm', 'conceptual', 'other'], default: 'other' },
    beatmapset: {
        osuId: { type: Number, required: true },
        artist: { type: String, required: true },
        title: { type: String, required: true },
        modes: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true }],
        length: { type: Number, required: true },
        bpm: { type: Number, required: true },
        submittedAt: { type: Date, required: true },
        genre: { type: String, required: true },
        language: { type: String, required: true },
        numberDiffs: { type: Number, required: true },
    },
    comment: { type: String, trim: true, maxlength: 300 },
    reviews: [{
        user: { type: 'ObjectId', ref: 'User', required: true },
        action: { type: String, enum: ['denied', 'accepted'] },
        comment: { type: String, trim: true, maxlength: 300 },
    }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/modRequest').default}
 */
const ModRequest = mongoose.model('ModRequest', modRequestsSchema);

module.exports = ModRequest;
