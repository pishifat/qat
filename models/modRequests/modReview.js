const mongoose = require('mongoose');

const modReviewsSchema = new mongoose.Schema({
    modRequest: { type: 'ObjectId', ref: 'ModRequest', required: true },
    user: { type: 'ObjectId', ref: 'User', required: true },
    action: { type: String, enum: ['denied', 'accepted'], required: true },
    comment: { type: String, trim: true, maxlength: 300 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('../interfaces/modRequests/modReview').IModReviewModel}
 */
const ModReview = mongoose.model('ModReview', modReviewsSchema);

module.exports = ModReview;
