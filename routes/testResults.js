const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const User = require('../models/user');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('rcTest/testresults', {
        title: 'Ranking Criteria Test Results',
        script: '../javascripts/testResults.js',
        isTest: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
        isBnEvaluator: res.locals.userRequest.group == 'bn' && res.locals.userRequest.isBnEvaluator,
    });
});

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
];

/* GET relevant info. */
router.get('/relevantInfo', async (req, res) => {
    let tests = await testSubmissionService.query(
        {
            applicant: req.session.mongoId,
            status: 'finished',
        },
        defaultTestPopulate,
        {},
        true
    );

    res.json({ tests, isNat: res.locals.userRequest.isNat });
});


/* GET search for test */
router.get('/search/:user', api.isNat, async (req, res) => {
    let user;
    const userToSearch = helper.safeParam(req.params.user);

    if (isNaN(userToSearch)) {
        user = await User.findByUsername(userToSearch);
    } else {
        user = await User.findOne({ osuId: parseInt(userToSearch) });
    }

    if (!user) {
        return res.json({
            error: 'Cannot find user!',
            isNat: res.locals.userRequest.group == 'nat',
        });
    }

    const tests = await testSubmissionService.query(
        {
            applicant: user.id,
            status: 'finished',
        },
        defaultTestPopulate,
        {},
        true
    );

    if (!tests.length) {
        return res.json({ error: 'No tests saved for that user!', isNat: res.locals.userRequest.group == 'nat' });
    }

    res.json({ tests, isNat: res.locals.userRequest.group == 'nat' });
});

module.exports = router;
