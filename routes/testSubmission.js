const express = require('express');
const TestSubmission = require('../models/bnTest/testSubmission');
const TestAnswer = require('../models/bnTest/testAnswer');
const Logger = require('../models/log');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);

/* GET pending tests by user */
router.get('/tests', async (req, res) => {
    const tests = await TestSubmission.find({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    return res.json({ testList: tests });
});

/* POST test by user */
router.get('/tests/:id', async (req, res) => {
    let test = await TestSubmission
        .findOne({
            _id: req.params.id,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        })
        .populate([
            {
                path: 'applicant',
                select: 'username',
            },
            {
                path: 'answers',
                select: 'question optionsChosen',

                populate: {
                    path: 'question',
                    select: 'content category options questionType',

                    populate: {
                        path: 'options',
                        select: 'content',
                        match: {
                            active: true,
                        },
                    },
                },
            },
        ])
        .sort({ 'answers.question.category': 1 })
        .orFail();

    if (!test.startedAt) {
        test.startedAt = Date.now();
        test.status = 'wip';
        await test.save();
    }

    return res.json({
        test,
    });
});

/* POST submit answers */
router.post('/submitAnswer', async (req, res) => {
    if (!req.body.answerId || !req.body.checkedOptions) return res.json({ error: 'Something went wrong!' });

    const answer = await TestAnswer.findByIdAndUpdate(req.body.answerId, { optionsChosen: req.body.checkedOptions });

    if (!answer || answer.error) return res.json({ error: 'Something went wrong!' });
    else return res.json({ success: 'ok' });
});

/* POST submit test */
router.post('/submitTest', async (req, res) => {
    const test = await TestSubmission
        .findOne({
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        })
        .populate({
            path: 'answers',
            populate: {
                path: 'question',
                populate: {
                    path: 'options',
                },
            },
        })
        .orFail();

    const currentBnApp = await AppEvaluation
        .findOne({
            user: req.session.mongoId,
            mode: test.mode,
            active: true,
        })
        .orFail();

    let totalScore = 0;

    for (const answer of test.answers) {
        let questionScore = 0;

        for (const option of answer.question.options) {
            if (answer.optionsChosen.includes(option.id)) {
                questionScore += option.score;
            }
        }

        // Adding scores below 0 are just wrong answers - Only add 'overall' correct answers
        if (questionScore > 0) {
            totalScore += questionScore;
        }
    }

    totalScore = totalScore.toFixed(1);
    test.submittedAt = Date.now();
    test.status = 'finished';
    test.totalScore = totalScore;
    test.comment = req.body.comment;
    currentBnApp.test = test._id;

    await Promise.all([
        test.save(),
        currentBnApp.save(),
    ]);

    res.json({
        totalScore,
    });

    Logger.generate(req.session.mongoId, `Completed ${test.mode} BN app test`);

    const twoEvaluationModes = ['catch', 'mania'];
    const invalids = [8129817, 3178418];
    const assignedNat = await User.aggregate([
        {
            $match: {
                group: 'nat',
                isSpectator: { $ne: true },
                modes: test.mode,
                osuId: { $nin: invalids },
            },
        },
        {
            $sample: {
                size: twoEvaluationModes.includes(test.mode) ? 2 : 3,
            },
        },
    ]);

    currentBnApp.natEvaluators = assignedNat;
    await currentBnApp.save();
    const natList = assignedNat.map(n => n.username).join(', ');

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Submitted [BN application](http://bn.mappersguild.com/appeval?id=${currentBnApp.id}) with test score of **${totalScore}**`,
            color: discord.webhookColors.green,
            fields: [
                {
                    name: 'Assigned NAT',
                    value: natList,
                },
            ],
        }],
        test.mode
    );
});

module.exports = router;
