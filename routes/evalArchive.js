const express = require('express');
const bnApps = require('../models/bnApp.js');
const evals = require('../models/evaluation.js');
const evalRounds = require('../models/evalRound.js');
const users = require('../models/user.js');
const api = require('../models/api.js');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET eval archive page */
router.get('/', async (req, res, next) => {
    res.render('evaluations/evalarchive', { 
        title: 'Evaluation Archives', 
        script: '../javascripts/evalArchive.js', 
        isEval: true, 
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat'
    });
});

//population
const defaultAppPopulate = [
    { populate: 'applicant', display: 'username osuId', model: users.User },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote', model: evals.Evaluation },
    { innerPopulate: 'evaluations', model: evals.Evaluation, populate: { path: 'evaluator', select: 'username osuId', model: users.User } },
];

const defaultBnPopulate = [
    { populate: 'bn', display: 'username osuId', model: users.User },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote', model: evals.Evaluation },
    { innerPopulate: 'evaluations', model: evals.Evaluation, populate: { path: 'evaluator', select: 'username osuId', model: users.User } },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    res.json({ evaluator: req.session.mongoId });
});


/* POST search for user */
router.post('/search/', async (req, res) => {
    let u = await users.service.query({username: new RegExp('^' + req.body.username.trim() + '$', 'i')});
    if(!u){
        return res.json( { error: 'Cannot find user!'} );
    }
    let a = await bnApps.service.query({applicant: u.id, active: false}, defaultAppPopulate, {createdAt: 1}, true);
    let b = await evalRounds.service.query({bn: u.id, active: false}, defaultBnPopulate, {createdAt: 1}, true);
    res.json({a: a, b: b});
});

module.exports = router;
