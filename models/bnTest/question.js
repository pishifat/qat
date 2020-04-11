const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    category: { type: String, enum:
        [
            'codeOfConduct', 'general', 'spread', 'metadata',
            'timing', 'audio', 'videoBackground', 'skinning',
            'storyboarding', 'osu', 'taiko', 'catch', 'mania', 'bn',
        ], required: true },
    content: { type: String, required: true },
    active: { type: Boolean, default: false },
    questionType: { type: String, enum: ['text', 'image', 'fill'], required: true },
    options: [{ type: 'ObjectId', ref: 'Option' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
