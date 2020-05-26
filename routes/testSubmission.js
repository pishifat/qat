const express = require('express');
const api = require('../helpers/api');
const TestSubmission = require('../models/bnTest/testSubmission');
const TestAnswer = require('../models/bnTest/testAnswer');
const Logger = require('../models/log');
const BnApp = require('../models/bnApp');
const User = require('../models/user');

const router = express.Router();

router.use(api.isLoggedIn);

const defaultPopulate = [
    { path: 'applicant', select: 'username' },
    { path: 'answers', select: 'question optionsChosen' },
    {
        path: 'answers',
        populate: {
            path: 'question',
            populate: {
                path: 'options',
            },
        },
    },
];

/* GET test page */
router.get('/', (req, res) => {
    res.render('testsubmission', {
        title: 'Test Submission',
        script: '../javascripts/testSubmission.js',
        loggedInAs: req.session.mongoId,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* GET pending tests by user */
router.get('/tests', async (req, res) => {
    const tests = await TestSubmission.find({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    if (!tests || !tests.length || tests.error) {
        return res.redirect('/');
    }

    return res.json({ testList: tests });
});

/* POST test by user */
router.post('/loadTest', async (req, res) => {
    let test = await TestSubmission
        .findOne({
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        })
        .populate(defaultPopulate)
        .sort({ 'answers.question.category': 1 });

    if (!test || test.error) {
        return res.redirect('/');
    }

    if (!test.startedAt) {
        test.startedAt = Date.now();
        test.status = 'wip';
        await test.save();
    }

    return res.json(test);
});

/* POST submit answers */
router.post('/submitAnswer', async (req, res) => {
    if (!req.body.answerId || !req.body.checkedOptions) return res.json({ error: 'Something went wrong!' });

    let answer = await TestAnswer.findByIdAndUpdate(req.body.answerId, { optionsChosen: req.body.checkedOptions });

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
        .populate(defaultPopulate);

    const currentBnApp = await BnApp.findOne({
        applicant: req.session.mongoId,
        mode: test.mode,
        active: true,
    });

    if (!test || test.error || !currentBnApp || currentBnApp.error) return res.json({ error: 'Something went wrong!' });
    let displayScore = 0;

    for (const answer of test.answers) {
        let questionScore = 0;

        for (const option of answer.question.options) {
            if (answer.optionsChosen.indexOf(option.id) != -1) {
                questionScore += option.score;
            }
        }

        if (questionScore < 0) questionScore = 0;
        displayScore += questionScore;
    }

    displayScore = displayScore.toFixed(1);
    const [updatedTest, updatedApp] = await Promise.all([
        TestSubmission.findByIdAndUpdate(req.body.testId, {
            submittedAt: Date.now(),
            status: 'finished',
            totalScore: displayScore,
            comment: req.body.comment,
        }),
        BnApp.findByIdAndUpdate(currentBnApp.id, { test: test._id }),
    ]);

    if (!updatedTest || updatedTest.error || !updatedApp || updatedApp.error) return res.json({ error: 'Something went wrong!' });

    res.json(displayScore);
    Logger.generate(req.session.mongoId, `Completed ${test.mode} BN app test`);

    const twoEvaluationModes = ['catch', 'mania'];
    //const threeEvaluationModes = ['osu', 'taiko'];

    const invalids = [8129817, 3178418];
    const assignedNat = await User.aggregate([
        { $match: { group: 'nat', isSpectator: { $ne: true }, modes: test.mode, osuId: { $nin: invalids } } },
        { $sample: { size: twoEvaluationModes.includes(test.mode) ? 2 : 3 } },
    ]);
    let natList = '';

    for (let i = 0; i < assignedNat.length; i++) {
        let user = assignedNat[i];
        await BnApp.findByIdAndUpdate(currentBnApp.id, { $push: { natEvaluators: user._id } });
        natList += user.username;

        if (i + 1 < assignedNat.length) {
            natList += ', ';
        }
    }

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            description: `Submitted [BN application](http://bn.mappersguild.com/appeval?eval=${currentBnApp.id}) with test score of **${displayScore}**`,
            color: api.webhookColors.green,
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
