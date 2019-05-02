const express = require('express');
const api = require('../models/api');
const helper = require('./helper');
const bnAppsService = require('../models/bnApp').service;
const evalRoundsService = require('../models/evalRound').service;
const usersService = require('../models/user').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET eval archive page */
router.get('/', async (req, res, next) => {
    res.render('evaluations/evalarchive', {
        title: 'Evaluation Archives',
        script: '../javascripts/evalArchive.js',
        isEval: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultAppPopulate = [
    { populate: 'applicant', display: 'username osuId' },
    { populate: 'test', display: 'totalScore' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId' } },
];

const defaultBnPopulate = [
    { populate: 'bn', display: 'username osuId probation' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId' } },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    res.json({ evaluator: req.session.mongoId });
});

/* POST search for user */
router.post('/search/', async (req, res) => {
    let u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
    if (!u) {
        return res.json({ error: 'Cannot find user!' });
    }
    let a = await bnAppsService.query(
        { applicant: u.id, active: false, consensus: {$exists: true} },
        defaultAppPopulate,
        { createdAt: 1 },
        true
    );
    let b = await evalRoundsService.query(
        { bn: u.id, active: false, consensus: {$exists: true} },
        defaultBnPopulate,
        { createdAt: 1 },
        true
    );
    res.json({ a: a, b: b });
});

module.exports = router;
