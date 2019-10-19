const mongoose = require('mongoose');
const logsService = require('../log').service;
const questions = require('./question');
const BaseService = require('../baseService');

const testSubmission = new mongoose.Schema({
    applicant: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'] },
    status: { type: String, enum: ['tbd', 'wip', 'finished'], default: 'tbd' },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    totalScore: { type: Number }, //better to store this than populate full test for each application
    comment: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

testSubmission.virtual('answers', {
    ref: 'TestAnswer',
    localField: '_id',
    foreignField: 'test',
});

const testAnswer = new mongoose.Schema({
    test: { type: 'ObjectId', ref: 'TestSubmission', required: true },
    question: { type: 'ObjectId', ref: 'Question', required: true },
    optionsChosen: [{ type: 'ObjectId', ref: 'Option' }],
    feedback: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const TestAnswer = mongoose.model('TestAnswer', testAnswer);
const TestSubmission = mongoose.model('TestSubmission', testSubmission);

class TestSubmissionService extends BaseService
{
    constructor() {
        super(TestSubmission);
    }

    async updateAnswer(id, update) {
        try {
            return await TestAnswer.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }

    /**
     * Creates a test, including all the questions needed
     * @param {object} applicant UserId of applicant
     * @param {string} mode Options: 'osu', 'taiko', 'catch', 'mania'
     */
    async create(applicant, mode) {
        try {
            const test = await TestSubmission.create({ 
                applicant,
                mode,
            });
            
            /* Dumb stuff that may revisit someday
            try {
                // Group questions by category. Ex: { _id: 'osu', questions: [] }
                categories = await questions.Question.aggregate([{
                    $group: {
                        _id: '$category',
                        questions: { $push: '$$ROOT' },
                    }
                }]);
                await questions.Question.populate(categories, {
                    path: 'questions.options', model: options.Option
                });

                // Filter out unnecessary categories
                categories = categories.filter(c => {
                    (c._id != 'osu' && c._id != 'catch' && c._id != 'mania' && c._id != 'taiko') || (c._id == mode)
                });
                categories.forEach(c => {
                    // Filter out not active questions
                    c.questions = c.questions.filter(q => q.active);
                    // Take 5 per each category
                    c.questions = c.questions.slice(0, 5);
                });

            } catch (error) {
                return { error: 'could not generate questions' };
            } 
            */
            
            let categoriesObject = [
                { name: 'bn', total: 5 },
                { name: 'codeOfConduct', total: 1 },
                { name: 'general', total: 1 },
                { name: 'spread', total: 1 },
                { name: 'metadata', total: 1 },
                { name: 'timing', total: 1 },
                { name: 'audio', total: 1 },
                { name: 'videoBackground', total: 1 },
                { name: 'skinning', total: 1 },
                { name: 'storyboarding', total: 1 },
            ];
            categoriesObject.push({ name: mode, total: 6 });
            
            let qs = [];
            for (let i = 0; i < categoriesObject.length; i++) {
                const name = categoriesObject[i].name;
                const total = categoriesObject[i].total;
                try {
                    const questionsByCategory = await questions.Question.aggregate([ { $match : { category: name, active: true } }, { $sample: { size: total } } ]);
                    for (let j = 0; j < questionsByCategory.length; j++) {
                        const q = questionsByCategory[j];
                        qs.push(q);
                    }
                } catch (error) {
                    return { error: 'Something went wrong' };
                }
            }
            
            let questionsToInsert = [];
            qs.forEach(q => {
                questionsToInsert.push({
                    test: test._id,
                    question: q._id,
                });
            });
            await TestAnswer.insertMany(questionsToInsert);

            return test;
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: 'could not create the test' };
        }
    }
}

const service = new TestSubmissionService();

module.exports = { service, TestSubmission, TestAnswer };