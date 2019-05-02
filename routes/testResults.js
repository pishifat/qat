const express = require('express');
const api = require('../models/api');
const helper = require('./helper');
const questionsService = require('../models/bnTest/question').service;
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const usersService = require('../models/user').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('rcTest/testresults', {
        title: 'Ranking Criteria Test Results',
        script: '../javascripts/testResults.js',
        isTest: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isBnEvaluator: res.locals.userRequest.group == 'bn' && res.locals.userRequest.isBnEvaluator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [{ populate: 'options', display: 'content score metadataType' }];

const defaultTestPopulate = [
    { populate: 'applicant', display: 'username osuId' },
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
    {
        innerPopulate: 'answers',
        populate: {
            path: 'metadataInput',
        },
    },
];

/* GET relevant info. */
router.get('/relevantInfo', async (req, res, next) => {
    let tests = await testSubmissionService.query(
        {
            applicant: req.session.mongoId,
            status: 'finished',
        },
        defaultTestPopulate,
        {},
        true
    );

    res.json({tests: tests, isNat: res.locals.userRequest.group == 'nat'});
});


/* POST search for test */
router.post('/search/', api.isNat, async (req, res) => {
    let u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
    if (!u) {
        return res.json({ error: 'Cannot find user!' });
    }
    let tests = await testSubmissionService.query(
        {
            applicant: u.id,
            status: 'finished',
        },
        defaultTestPopulate,
        {},
        true
    );

    if (!tests.length) {
        return res.json({ error: 'No tests saved for that user!' });
    }

    res.json(tests);
});

/* POST edit additional points because metadata is unreliable */
router.post('/updateAdditionalPoints/:id', api.isNat, async (req, res) => {
    await testSubmissionService.update(req.params.id, { additionalPoints: req.body.points });
    let t = await testSubmissionService.query({_id: req.params.id}, defaultTestPopulate);
    res.json(t);
});

module.exports = router;
