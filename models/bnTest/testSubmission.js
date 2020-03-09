const mongoose = require('mongoose');
const Question = require('./question');

const testSubmissionSchema = new mongoose.Schema({
    applicant: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'] },
    status: { type: String, enum: ['tbd', 'wip', 'finished'], default: 'tbd' },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    totalScore: { type: Number }, //better to store this than populate full test for each application
    comment: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

testSubmissionSchema.virtual('answers', {
    ref: 'TestAnswer',
    localField: '_id',
    foreignField: 'test',
});

const testAnswerSchema = new mongoose.Schema({
    test: { type: 'ObjectId', ref: 'TestSubmission', required: true },
    question: { type: 'ObjectId', ref: 'Question', required: true },
    optionsChosen: [{ type: 'ObjectId', ref: 'Option' }],
    feedback: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class TestSubmissionService
{

    /**
     * Creates a test, including all the questions needed
     * @param {object} applicant UserId of applicant
     * @param {string} mode Options: 'osu', 'taiko', 'catch', 'mania'
     */
    static async generateTest(applicant, mode) {
        try {
            const test = await this.create({
                applicant,
                mode,
            });

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
                    const questionsByCategory = await Question.aggregate([ { $match: { category: name, active: true } }, { $sample: { size: total } } ]);

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
        } catch (error) {
            return { error: 'could not create the test' };
        }
    }

}

const TestAnswer = mongoose.model('TestAnswer', testAnswerSchema);

testSubmissionSchema.loadClass(TestSubmissionService);
const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);

module.exports = { TestSubmission, TestAnswer };
