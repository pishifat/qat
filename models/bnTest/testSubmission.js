const mongoose = require('mongoose');
const Question = require('./question');
const TestAnswer = require('./testAnswer');

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

class TestSubmissionService extends mongoose.Model
{

    /**
     * Creates a test, including all the questions needed
     * @param {object} applicant UserId of applicant
     * @param {string} mode Options: 'osu', 'taiko', 'catch', 'mania'
     * @returns {Promise<object>} the test
     */
    static async generateTest(applicant, mode) {
        try {
            const test = await this.create({
                applicant,
                mode,
            });

            let bnTotal = 5;
            let codeOfConductTotal = 1;
            let generalTotal = 1;
            let spreadTotal = 1;
            let metadataTotal = 1;
            let timingTotal = 1;
            let audioTotal = 1;
            let videoBackgroundTotal = 1;
            let skinningTotal = 1;
            let storyboardingTotal = 1;
            let modeTotal = mode == 'mania' ? 7 : 6;

            let categoriesObject = [
                { name: 'bn', total: bnTotal },
                { name: 'codeOfConduct', total: codeOfConductTotal },
                { name: 'general', total: generalTotal },
                { name: 'spread', total: spreadTotal },
                { name: 'metadata', total: metadataTotal },
                { name: 'timing', total: timingTotal },
                { name: 'audio', total: audioTotal },
                { name: 'videoBackground', total: videoBackgroundTotal },
                { name: 'storyboarding', total: storyboardingTotal },
            ];

            // because mania doesn't have skinning questions
            if (mode != 'mania') {
                categoriesObject.push({ name: 'skinning', total: skinningTotal });
            }

            // not included in object declaration so skinning comes first
            categoriesObject.push({ name: mode, total: modeTotal });

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
            return {
                error: 'could not create the test',
            };
        }
    }

}

testSubmissionSchema.loadClass(TestSubmissionService);
/**
 * @type {import('../interfaces/testSubmission').ITestSubmissionModel}
 */
const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);

module.exports = TestSubmission;
