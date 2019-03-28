const express = require('express');
const api = require('../models/api');
const testSubmission = require('../models/testSubmission');
const users = require('../models/user');
const questions = require('../models/question');
const options = require('../models/option');

const router = express.Router();
router.use(api.isLoggedIn);

const defaultPopulate = [
    { populate: 'applicant', display: 'username', model: users.User },
    { populate: 'answers', display: 'question optionsChosen', model: testSubmission.TestAnswer },
    { innerPopulate: 'answers', model: testSubmission.TestAnswer, populate: { 
            path: 'question', model: questions.Question, populate: {
                path: 'options', model: options.Option
            }
        } 
    },
];

/* GET test page */
router.get('/', async (req, res, next) => {
    res.render('testsubmission', {
        title: 'Test Submission',
        script: '../javascripts/testSubmission.js',
    });
});

/* GET pending tests by user */
router.get('/tests', async (req, res, next) => {
    const tests = await testSubmission.service.query({ 
        applicant: req.session.mongoId, 
        status: { $ne: 'finished' },
    }, null, null, true);
    
    if (!tests || !tests.length || tests.error) {
        return res.redirect('/qat');
    }

    return res.json({ testList: tests });
});

/* POST test by user */
router.post('/loadTest', async (req, res, next) => {
    let test = await testSubmission.service.query({ 
        _id: req.body.testId,
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    }, defaultPopulate, { 'answers.question.category': 1 });
    
    if (!test || test.error) {
        return res.redirect('/qat');
    }

    if (!test.startedAt) {
        await testSubmission.service.update(req.body.testId, { startedAt: Date.now(), status: 'wip' });
        test.startedAt = Date.now();
    }

    return res.json(test);
});

/* POST submit answers */
router.post('/submit', async (req, res, next) => {
    let test = await testSubmission.service.query({ 
        _id: req.body.testId,
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    }, defaultPopulate);

    if (!test || test.error) {
        return res.json({ error: 'Something went wrong!' });
    }

    let displayScore = 0;
    let answer;
    let option;
    for (let i = 0; i < test.answers.length; i++) {
        answer = test.answers[i];
        for (let j = 0; j < answer.question.options.length; j++) {
            option = answer.question.options[j];
            if(req.body.checkedOptions.indexOf(option.id) >= 0){
                await testSubmission.service.updateAnswer(answer.id, {$push: {optionsChosen: option.id}});
                displayScore += option.score;
            }
        }
    }
    let metadataInput = await testSubmission.service.createMetadataInput(
        req.body.title, req.body.titleUnicode, 
        req.body.artist, req.body.artistUnicode, 
        req.body.source, req.body.reference1,
        req.body.reference2, req.body.reference3
    );
    
    let inputObject = [
        {category: 'title', input: req.body.title},
        {category: 'titleUnicode', input: req.body.titleUnicode},
        {category: 'artist', input: req.body.artist},
        {category: 'artistUnicode', input: req.body.artistUnicode},
        {category: 'source', input: req.body.source},
        {category: 'reference', input: req.body.reference1},
        {category: 'reference', input: req.body.reference2},
        {category: 'reference', input: req.body.reference3},
    ];
    
    for (let i = 0; i < test.answers.length; i++) {
        if (test.answers[i].question.category == 'metadata'){
            answer = test.answers[i];
            await testSubmission.service.updateAnswer(answer.id, {$push: {metadataInput: metadataInput}});
            for (let j = 0; j < answer.question.options.length; j++) {
                option = answer.question.options[j];
                for (let k = 0; k < inputObject.length; k++) {
                    if(option.metadataType == inputObject[k].category){
                        if(option.content == inputObject[k].input.trim()){
                            await testSubmission.service.updateAnswer(answer.id, {$push: {optionsChosen: option.id}});
                            displayScore += option.score;
                        }
                    }
                    
                }
            }
            break;
        }
    }
    
    await testSubmission.service.update(req.body.testId, { submittedAt: Date.now(), status: 'wip' });

    res.json(displayScore);
});

router.get('/displayScore/:score', async (req, res, next) => {
    res.redirect('/qat');
});

// Temp
router.post('/generateTest', async (req, res, next) => {
    await testSubmission.service.create(req.session.mongoId, 'catch');
    
    res.redirect('/nat/testSubmission');
});

module.exports = router;
