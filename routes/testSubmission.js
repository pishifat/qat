const express = require('express');
const TestSubmission = require('../models/bnTest/testSubmission');
const TestAnswer = require('../models/bnTest/testAnswer');
const Logger = require('../models/log');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const util = require('../helpers/util');
const { AppEvaluationConsensus } = require('../shared/enums');

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
        test.startedAt = new Date();
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

    await TestAnswer
        .findByIdAndUpdate(req.body.answerId, { optionsChosen: req.body.checkedOptions })
        .orFail();

    return res.json({
        success: 'Answer saved',
    });
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

    totalScore = Math.round(totalScore * 10) / 10;
    test.submittedAt = new Date;
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
        success: 'Test submitted!',
        isOsu: test.mode == 'osu',
    });

    Logger.generate(
        req.session.mongoId,
        `Completed ${test.mode} BN app test`,
        'application',
        currentBnApp._id
    );

    let fields = [];

    if (totalScore >= 12.5 || test.mode != 'osu') {
        const assignedNat = test.mode == 'osu' ? await User.getAssignedNat(test.mode, [], 2) : await User.getAssignedNat(test.mode);
        currentBnApp.natEvaluators = assignedNat;

        const assignments = [];

        const days = util.findDaysBetweenDates(new Date(), new Date(currentBnApp.deadline));

        for (const user of assignedNat) {
            assignments.push({
                date: new Date(),
                user: user._id,
                daysOverdue: days,
            });
        }

        currentBnApp.natEvaluatorHistory = assignments;

        await currentBnApp.save();

        const natList = assignedNat.map(n => n.username).join(', ');

        fields.push({
            name: 'Assigned NAT',
            value: natList,
        });

        let trialNatList = '';

        if (test.mode == 'osu') {
            const assignedTrialNat = await User.getAssignedTrialNat(test.mode, [], 2);
            currentBnApp.bnEvaluators = assignedTrialNat;
            await currentBnApp.save();
            trialNatList = assignedTrialNat.map(n => n.username).join(', ');
            fields.push({
                name: 'Assigned BN',
                value: trialNatList,
            });
        }
    }

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Submitted [BN application](http://bn.mappersguild.com/appeval?id=${currentBnApp.id}) with test score of **${totalScore}**`,
            color: discord.webhookColors.green,
            fields,
        }],
        test.mode
    );

    if (totalScore < 12.5 && test.mode == 'osu') {
        let cooldown = new Date();
        cooldown.setDate(cooldown.getDate() - 30);

        currentBnApp.cooldownDate = cooldown;
        currentBnApp.active = false;
        currentBnApp.archivedAt = new Date();
        currentBnApp.consensus = AppEvaluationConsensus.Fail;
        currentBnApp.feedback = 'Below minimum test score (12.5)';
        await currentBnApp.save();

        discord.webhookPost(
            [{
                color: discord.webhookColors.black,
                description: `Archived [**${req.session.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${currentBnApp.id}) with **Fail** consensus because of below minimum test score (12.5).`,
            }],
            currentBnApp.mode
        );

        Logger.generate(
            req.session.mongoId,
            `Set ${req.session.username}'s ${currentBnApp.mode} application eval as "${currentBnApp.consensus}"`,
            'appEvaluation',
            currentBnApp._id
        );
        await currentBnApp.save();
    }
});

module.exports = router;
