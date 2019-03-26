const config = require('../config.json');
const mongoose = require('mongoose');
const qatDb = mongoose.createConnection(config.qat.connection, { useNewUrlParser: true });
const questions = require('./question');

const testSubmission = new mongoose.Schema({
    applicant: { type: 'ObjectId', ref: 'QatUser', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'] },
    status: { type: String, enum: ['tbd', 'wip', 'finished'], default: 'tbd' },
    startedAt: { type: Date },
    submittedAt: { type: Date },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

testSubmission.virtual('answers', {
    ref: 'TestAnswer',
    localField: '_id',
    foreignField: 'test',
});

const testAnswer = new mongoose.Schema({
    test: { type: 'ObjectId', ref: 'TestSubmission', required: true },
    question: { type: 'ObjectId', ref: 'Question', required: true },
    optionChose: { type: 'ObjectId', ref: 'Option' },
    feedback: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const TestAnswer = qatDb.model('TestAnswer', testAnswer);
const TestSubmission = qatDb.model('TestSubmission', testSubmission);

class TestSubmissionService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = TestSubmission.find(params);
        } else {
            query = TestSubmission.findOne(params);
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
            return await TestSubmission.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(applicant, mode) {
        try {
            const test = await TestSubmission.create({ 
                applicant: applicant,
                mode: mode
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
            
            const categories = [
                'codeOfConduct', 'general', 'spread', 'metadata', 
                'timing', 'audio', 'videoBackground', 'skinning', 
                'storyboarding', 'bn'
            ];
            categories.push(mode);
            
            let qs = [];
            for (let i = 0; i < categories.length; i++) {
                const c = categories[i];
                try {
                    // 5 questions per category ?
                    const questionsByCategory = await questions.Question.find({ category: c, active: true }).limit(5).exec()
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

            return { success: 'Test created' };
        } catch(error) {
            return { error: 'could not create the test' };
        }
    }
}

const service = new TestSubmissionService();

module.exports = { service, TestSubmission, TestAnswer };