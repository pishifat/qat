const express = require('express');
const bnApps = require('../models/bnApp.js');
const evals = require('../models/evaluation.js');
const evalRounds = require('../models/evalRound.js');
const users = require('../models/user.js');
const api = require('../models/api.js');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET eval archive page */
router.get('/', async (req, res, next) => {
    res.render('evalarchive', { 
        title: 'Evaluation Archives', 
        script: '../javascripts/evalArchive.js', 
        isEval: true, 
        layout: 'qatlayout',
        isBnOrQat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'qat',
        isQat: res.locals.userRequest.group == 'qat'
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
    res.json({ evaluator: req.session.qatMongoId });
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


/* POST set invidivual eval */
router.post('/setComplete/', async (req, res) => {
    for (let i = 0; i < req.body.checkedApps.length; i++) {
        await bnApps.service.update(req.body.checkedApps[i], {active: false});
    }
    
    let a = await bnApps.service.query({active: false}, defaultDiscussPopulate, {createdAt: 1}, true );
    let b = await bnApps.service.query({active: true}, defaultBnPopulate, {createdAt: 1}, true );
    res.json(a);
});

module.exports = router;
