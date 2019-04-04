const express = require('express');
const api = require('../models/api');
const helper = require('./helper');
const questionsService = require('../models/bnTest/question').service;
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const usersService = require('../models/user').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('rcTest/testresults', {
        title: 'RC Test Results',
        script: '../javascripts/testResults.js',
        isManageTest: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
    });
});

//population
const defaultPopulate = [{ populate: 'options', display: 'content score metadataType' }];

const defaultTestPopulate = [
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
    {
        innerPopulate: 'answers',
        populate: {
            path: 'metadataInput',
        },
    },
];

/* POST search for test */
router.post('/search/', async (req, res) => {
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

/* GET applicant listing. */
router.get('/load/:type', async (req, res, next) => {
    let q = await questionsService.query({ category: req.params.type }, defaultPopulate, {}, true);
    res.json(q);
});

module.exports = router;
