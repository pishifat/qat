const express = require('express');
const api = require('../helpers/api');
const helper = require('../helpers/helpers');
const bnAppsService = require('../models/bnApp').service;
const evalRoundsService = require('../models/evalRound').service;
const User = require('../models/user');

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
    { populate: 'test', display: 'totalScore comment' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId group' } },
];

const defaultBnPopulate = [
    { populate: 'bn', display: 'username osuId probation modes' },
    { populate: 'evaluations', display: 'evaluator behaviorComment moddingComment vote' },
    { innerPopulate: 'evaluations', populate: { path: 'evaluator', select: 'username osuId group' } },
];

/* GET applicant listing. */
router.get('/relevantInfo', (req, res) => {
    res.json({ evaluator: res.locals.userRequest });
});

/* GET search for user */
router.get('/search/:user', async (req, res) => {
    let u;
    const userToSearch = helper.safeParam(req.params.user);

    if (isNaN(userToSearch)) {
        u = await User.findByUsername(userToSearch);
    } else {
        u = await User.findOne({ osuId: parseInt(userToSearch) });
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

    if (!round) {
        round = await evalRoundsService.query(
            { _id: idToSearch, active: false, consensus: { $exists: true } },
            defaultBnPopulate
        );
    }

    if (!round || !round.consensus) { //consensus because undefined round results in { error: undefined }, and that says !round is false
        return res.json({ error: 'Cannot find evaluation!' });
    }

    res.json({ round, evaluator: res.locals.userRequest });
});

/* GET search by number of rounds */
router.get('/searchRecent/:limit', async (req, res) => {
    if (!req.params.limit) {
        req.params.limit = 12;
    } else {
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

/* POST set evals as complete */
router.post('/unarchive/:id', api.isNat, async (req, res) => {
    if (req.body.type == 'application') {
        let a = await bnAppsService.query({ _id: req.params.id });

        if (!a || a.error) {
            return res.json({ error: 'Could not load evalRound!' });
        }

        let u = await User.findById(a.applicant);

        if (!u || u.error) {
            return res.json({ error: 'Could not load user!' });
        }

        if (a.consensus == 'pass') {
            await User.findByIdAndUpdate(u.id, { $pull: { modes: a.mode } });
            await User.findByIdAndUpdate(u.id, { $pull: { probation: a.mode } });
            await evalRoundsService.deleteManyByUserId(u.id);

            if (u.modes.length == 1) {
                await User.findByIdAndUpdate(u.id, { group: 'user' });
                await User.findByIdAndUpdate(u.id, { $pop: { bnDuration: 1 } });
            }
        }

        await bnAppsService.update(a.id, { active: true });

        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '15001599',
                fields: [
                    {
                        name: `http://bn.mappersguild.com/appeval?eval=${a.id}`,
                        value: `**${u.username}**'s application evaluation un-archived`,
                    },
                ],
            }],
            a.mode
        );

    } else if (req.body.type == 'evalRound') {
        let er = await evalRoundsService.query({ _id: req.params.id });

        if (!er || er.error) {
            return res.json({ error: 'Could not load evalRound!' });
        }

        let u = await User.findById(er.bn);

        if (!u || u.error) {
            return res.json({ error: 'Could not load user!' });
        }

        if (er.consensus == 'fail') {
            await User.findByIdAndUpdate(u.id, { $push: { modes: er.mode } });
            await User.findByIdAndUpdate(u.id, { $push: { probation: er.mode } });

            if (!u.modes.length) {
                await User.findByIdAndUpdate(u.id, { group: 'bn' });
                await User.findByIdAndUpdate(u.id, { $pop: { bnDuration: 1 } });
            }
        }

        if (er.consensus == 'extend' || er.consensus == 'pass') {
            await evalRoundsService.deleteManyByUserId(u.id);

            if (u.probation.indexOf(er.mode) < 0) {
                await User.findByIdAndUpdate(u.id, { $push: { probation: er.mode } });
            }
        }

        await evalRoundsService.update(req.params.id, { active: true });

        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '15001599',
                fields: [
                    {
                        name: `http://bn.mappersguild.com/bneval?eval=${er.id}`,
                        value: `**${u.username}**'s current BN evaluation un-archived`,
                    },
                ],
            }],
            er.mode
        );
    }

    res.json({ success: 'ok' });
});

module.exports = router;
