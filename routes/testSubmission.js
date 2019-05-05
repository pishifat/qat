const express = require('express');
const api = require('../models/api');
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const logsService = require('../models/log').service;
const bnAppsService = require('../models/bnApp').service;

const router = express.Router();
router.use(api.isLoggedIn);

const defaultPopulate = [
    { populate: 'applicant', display: 'username' },
    { populate: 'answers', display: 'question optionsChosen' },
    {
        innerPopulate: 'answers',
        populate: {
            path: 'question',
            populate: {
                path: 'options',
            },
        },
    },
];

/* GET test page */
router.get('/', async (req, res, next) => {
    res.render('testsubmission', {
        title: 'Test Submission',
        script: '../javascripts/testSubmission.js',
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* GET pending tests by user */
router.get('/tests', async (req, res, next) => {
    const tests = await testSubmissionService.query(
        {
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        null,
        null,
        true
    );

    if (!tests || !tests.length || tests.error) {
        return res.redirect('/');
    }

    return res.json({ testList: tests });
});

/* POST test by user */
router.post('/loadTest', async (req, res, next) => {
    let test = await testSubmissionService.query(
        {
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        defaultPopulate,
        { 'answers.question.category': 1 }
    );

    if (!test || test.error) {
        return res.redirect('/');
    }

    if (!test.startedAt) {
        await testSubmissionService.update(req.body.testId, { startedAt: Date.now(), status: 'wip' });
        test.startedAt = Date.now();
    }

    return res.json(test);
});

/* POST submit answers */
router.post('/submit', async (req, res, next) => {
    let test = await testSubmissionService.query(
        {
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        defaultPopulate
    );

    if (!test || test.error) {
        return res.json({ error: 'Something went wrong!' });
    }

    let displayScore = 0;
    let answer;
    let option;
    for (let i = 0; i < test.answers.length; i++) {
        answer = test.answers[i];
        let questionScore = 0;
        for (let j = 0; j < answer.question.options.length; j++) {
            option = answer.question.options[j];
            if (req.body.checkedOptions.indexOf(option.id) >= 0) {
                await testSubmissionService.updateAnswer(answer.id, { $push: { optionsChosen: option.id } });
                questionScore += option.score;
            }
        }
        if(questionScore < 0) questionScore = 0;
        displayScore += questionScore;
    }
    let metadataInput = await testSubmissionService.createMetadataInput(
        req.body.title,
        req.body.titleUnicode,
        req.body.artist,
        req.body.artistUnicode,
        req.body.source,
        req.body.reference1,
        req.body.reference2,
        req.body.reference3
    );

    let inputObject = [
        { category: 'title', input: req.body.title },
        { category: 'titleUnicode', input: req.body.titleUnicode },
        { category: 'artist', input: req.body.artist },
        { category: 'artistUnicode', input: req.body.artistUnicode },
        { category: 'source', input: req.body.source },
        { category: 'reference', input: req.body.reference1 },
        { category: 'reference', input: req.body.reference2 },
        { category: 'reference', input: req.body.reference3 },
    ];

    let escape;
    for (let i = 0; i < test.answers.length && !escape; i++) {
        if (test.answers[i].question.category == 'metadata') {
            answer = test.answers[i];
            await testSubmissionService.updateAnswer(answer.id, { $push: { metadataInput: metadataInput } });
            let notEmpty = [];
            answer.question.options.forEach(option => {
                notEmpty.push(option.metadataType);
            });
            let occupiedEmptyCategories = [];
            for (let j = 0; j < answer.question.options.length && !escape; j++) {
                option = answer.question.options[j];
                for (let k = 0; k < inputObject.length && !escape; k++) {
                    if (option.metadataType == inputObject[k].category) {
                        if (option.content == inputObject[k].input.trim()) {
                            await testSubmissionService.updateAnswer(answer.id, {
                                $push: { optionsChosen: option.id },
                            });
                            displayScore += option.score;
                            if (option.metadataType == 'reference') {
                                escape = true;
                            }
                        }
                    }else if(!inputObject[k].length && notEmpty.indexOf(inputObject[k].category) < 0 && occupiedEmptyCategories.indexOf(inputObject[k].category) < 0){
                        displayScore += 0.5;
                        occupiedEmptyCategories.push(inputObject[k].category);
                    }
                }
            }
            escape = true;
        }
    }
    displayScore = Math.round(displayScore * 10) / 10;
    await testSubmissionService.update(req.body.testId, {
        submittedAt: Date.now(),
        status: 'finished',
        totalScore: displayScore,
    });
    const currentBnApp = await bnAppsService.query({
        applicant: req.session.mongoId,
        mode: test.mode,
        active: true 
    });
    await bnAppsService.update(currentBnApp.id, {test: test._id});
    res.json(displayScore);
    logsService.create(req.session.mongoId, `Completed ${test.mode} BN app test`);
});

module.exports = router;
