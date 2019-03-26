const config = require('../config.json');
const mongoose = require('mongoose');
const qatDb = mongoose.createConnection(config.qat.connection, { useNewUrlParser: true })

const questionSchema = new mongoose.Schema({
    category: { type: String, enum: [
        'codeOfConduct', 'general', 'spread', 'metadata', 
        'timing', 'audio', 'videoBackground', 'skinning', 
        'storyboarding', 'osu', 'taiko', 'catch', 'mania', 'bn'], required: true},
    content: { type: String, required: true },
    //info: { type: String },
    active: { type: Boolean, default: true },
    questionType: { type: String, enum: ["text", "image", "fill"], required: true },
    options: [{ type: 'ObjectId', ref: 'Option'}],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Question = qatDb.model('Question', questionSchema);

class QuestionService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = Question.find(params);
        } else {
            query = Question.findOne(params);
        }

        if (populate) {
            for (let i = 0; i < populate.length; i++) {
                const p = populate[i];
                
                if (p.innerPopulate) {
                    query.populate({ path: p.innerPopulate, model: p.model, populate: p.populate });
                } else {
                    query.populate(p.populate, p.display, p.model);
                }
            }
        }

        if (sorting) {
            query.sort(sorting);
        }

        try {
            return await query.exec();
        } catch(error) {
            return { error: error._message };
        }
    }

    
    async update(id, update) {
        try {
            return await Question.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async remove(id) {
        try {
            return await Question.findByIdAndRemove(id);
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(category, content, questionType) {
        try {
            return await Question.create({category: category, content: content, questionType: questionType});
        } catch(error) {
            return { error: error._message }
        }
    }
    
}

const service = new QuestionService();

module.exports = { service, Question };