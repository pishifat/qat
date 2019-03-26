const express = require('express');
const api = require('../models/api');
const testSubmission = require('../models/testSubmission');
const users = require('../models/qatUser');
const questions = require('../models/question');
const options = require('../models/option');

const router = express.Router();
router.use(api.isLoggedIn);

const defaultPopulate = [
    { populate: 'applicant', display: 'username', model: users.QatUser },
    { populate: 'answers', display: 'question optionChose', model: testSubmission.TestAnswer },
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
        layout: 'qatLayout'
    });
});

/* GET pending tests by user */
router.get('/tests', async (req, res, next) => {
    const tests = await testSubmission.service.query({ 
        applicant: req.session.qatMongoId, 
        status: { $ne: 'finished' },
    }, null, null, true);
    
    if (!tests || tests.error) {
        return res.redirect('/qat');
    }

    return res.json({ testList: tests });
});

/* POST test by user */
router.post('/loadTest', async (req, res, next) => {
    let test = await testSubmission.service.query({ 
        _id: req.body.testId,
        applicant: req.session.qatMongoId,
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
        applicant: req.session.qatMongoId,
        status: { $ne: 'finished' },
    });
    
    if (!test || test.error) {
        return res.json({ error: 'Something went wrong!' });
    }

    await testSubmission.service.update(req.body.testId, { submittedAt: Date.now(), status: 'finished' });
    // todo Update with chosen answers

    return res.json(test);
});

// Temp
router.post('/generateTest', async (req, res, next) => {
    await testSubmission.service.create(req.session.qatMongoId, 'catch');
    
    res.redirect('/qat/testSubmission');
});

module.exports = router;
