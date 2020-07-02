const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    evaluator: { type: 'ObjectId', ref: 'User', required: true },
    behaviorComment: { type: String, required: true },
    moddingComment: { type: String, required: true },
    vote: { type: Number, enum: [1, 2, 3] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('../interfaces/review').IReviewModel}
 */
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
