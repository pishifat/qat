const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const bnAppsService = require('../models/bnApp').service;
const evalRoundsService = require('../models/evalRound').service;
const usersService = require('../models/user').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET eval archive page */
router.get('/', (req, res) => {
    res.render('evaluations/evalarchive', {
        title: 'Evaluation Archives',
        script: '../javascripts/evalArchive.js',
        isEval: true,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultAppPopulate = [
    { populate: 'applicant', display: 'username osuId' },
    { populate: 'test', display: 'totalScore additionalPoints comment' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId group' } },
];

const defaultBnPopulate = [
    { populate: 'bn', display: 'username osuId probation' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId group' } },
];

/* GET applicant listing. */
router.get('/relevantInfo', (req, res) => {
    res.json({ evaluator: req.session.mongoId });
});

/* GET search for user */
router.get('/search/:user', async (req, res) => {
    let u;
    const userToSearch = helper.safeParam(req.params.user);
    if (isNaN(userToSearch)) {
        u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(userToSearch) + '$', 'i') });
    } else {
        u = await usersService.query({ osuId: parseInt(userToSearch) });
    }
    if (!u) {
        return res.json({ error: 'Cannot find user!' });
    }
    let a = await bnAppsService.query(
        { applicant: u.id, active: false, consensus: { $exists: true } },
        defaultAppPopulate,
        { createdAt: 1 },
        true
    );
    let b = await evalRoundsService.query(
        { bn: u.id, active: false, consensus: { $exists: true } },
        defaultBnPopulate,
        { createdAt: 1 },
        true
    );
    res.json({ a, b, evaluator: req.session.mongoId });
});

/* GET search for user */
router.get('/searchById/:id', async (req, res) => {
    let round;
    const idToSearch = helper.safeParam(req.params.id);
    round = await bnAppsService.query(
        { _id: idToSearch, active: false, consensus: { $exists: true } },
        defaultAppPopulate
    );
    
    if(!round){
        round = await evalRoundsService.query(
            { _id: idToSearch, active: false, consensus: { $exists: true } },
            defaultBnPopulate
        );
    }
    if(!round.consensus){ //consensus because undefined round results in { error: undefined }, and that says !round is false
        return res.json({ error: 'Cannot find evaluation!' });
    }
    
    res.json({ round, evaluator: req.session.mongoId });
});

/* GET search by number of rounds */
router.get('/searchRecent/:limit', async (req, res) => {
    if(!req.params.limit){
        req.params.limit = 12;
    }else{
        req.params.limit = parseInt(req.params.limit);
    }
    let a = await bnAppsService.query(
        { active: false, consensus: { $exists: true } },
        defaultAppPopulate,
        { createdAt: -1 },
        true,
        req.params.limit
    );
    let b = await evalRoundsService.query(
        { active: false, consensus: { $exists: true } },
        defaultBnPopulate,
        { createdAt: -1 },
        true,
        req.params.limit
    );
    res.json({ a, b });
});

module.exports = router;
