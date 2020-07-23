const mongoose = require('mongoose');

const modRequestsSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User', required: true },
    category: { type: String, enum: ['simple', 'tech', 'doubleBpm', 'conceptual', 'other'], default: 'other' },
    beatmapset: { type: 'ObjectId', ref: 'Beatmapset', required: true },
    comment: { type: String, trim: true, maxlength: 300 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

modRequestsSchema.virtual('modReviews', {
    ref: 'ModReview',
    localField: '_id',
    foreignField: 'modRequest',
});

/**
 * @type {import('../interfaces/modRequests/modRequest').IModRequestModel}
 */
const ModRequest = mongoose.model('ModRequest', modRequestsSchema);

module.exports = ModRequest;
