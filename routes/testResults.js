const express = require('express');
const api = require('../models/api');
const questions = require('../models/bnTest/question');
const testSubmission = require('../models/bnTest/testSubmission');
const options = require('../models/bnTest/option');
const users = require('../models/user');

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
        isNat: res.locals.userRequest.group == 'nat' });
});

//population
const defaultPopulate = [
    { populate: 'options', display: 'content score metadataType', model: options.Option },
];

const defaultTestPopulate = [
    { populate: 'applicant', display: 'username', model: users.User },
    { populate: 'answers', display: 'question optionsChosen', model: testSubmission.TestAnswer },
    { innerPopulate: 'answers', model: testSubmission.TestAnswer, populate: { 
            path: 'question', model: questions.Question, populate: {
                path: 'options', model: options.Option
            }
        } 
    },
    { innerPopulate: 'answers', model: testSubmission.TestAnswer, populate: { 
        path: 'metadataInput', model: testSubmission.TestMetadataInput
        } 
    },
];

/* POST search for test */
router.post('/search/', async (req, res) => {
    let u = await users.service.query({username: new RegExp('^' + req.body.username.trim() + '$', 'i')});
    if(!u){
        return res.json( { error: 'Cannot find user!'} );
    }
    let tests = await testSubmission.service.query({
        applicant: u.id,
        status: 'finished',
    }, defaultTestPopulate, {}, true);

    if(!tests.length){
        return res.json( { error: 'No tests saved for that user!' } );
    }

    res.json(tests)
});

/* GET applicant listing. */
router.get('/load/:type', async (req, res, next) => {
    let q = await questions.service.query({category: req.params.type}, defaultPopulate, {}, true);
    res.json(q);
});



module.exports = router;
