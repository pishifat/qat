const mongoose = require('mongoose');
const BaseService = require('../baseService');

const questionSchema = new mongoose.Schema({
    category: { type: String, enum: [
        'codeOfConduct', 'general', 'spread', 'metadata',
        'timing', 'audio', 'videoBackground', 'skinning',
        'storyboarding', 'osu', 'taiko', 'catch', 'mania', 'bn'], required: true },
    content: { type: String, required: true },
    active: { type: Boolean, default: false },
    questionType: { type: String, enum: ['text', 'image', 'fill'], required: true },
    options: [{ type: 'ObjectId', ref: 'Option' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Question = mongoose.model('Question', questionSchema);

class QuestionService extends BaseService
{
    constructor() {
        super(Question);
    }

    async remove(id) {
        try {
            return await Question.findByIdAndRemove(id);
        } catch (error) {
            return { error: error._message };
        }
    }

    async create(category, content, questionType) {
        try {
            return await Question.create({ category, content, questionType });
        } catch (error) {
            return { error: error._message };
        }
    }

}

const service = new QuestionService();

module.exports = { service, Question };