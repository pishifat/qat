const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    content: { type: String, required: true },
    score: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('../interfaces/option').IOptionModel}
 */
const Option = mongoose.model('Option', optionSchema);

module.exports = Option;
