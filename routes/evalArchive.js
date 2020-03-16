const express = require('express');
const api = require('../helpers/api');
const BnApp = require('../models/bnApp');
const EvalRound = require('../models/evalRound');
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
    { path: 'applicant', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    {
        path: 'evaluations',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

const defaultBnPopulate = [
    {
        path: 'bn',
        select: 'username osuId probation modes',
    },
    {
        path: 'evaluations',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

/* GET applicant listing. */
router.get('/relevantInfo', (req, res) => {
    res.json({ evaluator: res.locals.userRequest });
});

/* GET search for user */
router.get('/search/:user', async (req, res) => {
    let u;
    const userToSearch = decodeURI(req.params.user);

    if (isNaN(userToSearch)) {
        u = await User.findByUsername(userToSearch);
    } else {
        u = await User.findOne({ osuId: parseInt(userToSearch) });
    }

    if (!u) {
        return res.json({ error: 'Cannot find user!' });
    }

    let a = await BnApp
        .find({
            applicant: u.id,
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: 1 });

    let b = await EvalRound
        .find({
            bn: u.id,
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultBnPopulate)
        .sort({ createdAt: 1 });

    res.json({ a, b, evaluator: res.locals.userRequest });
});

/* GET search for user */
router.get('/searchById/:id', async (req, res) => {
    let round;
    const idToSearch = decodeURI(req.params.id);
    round = await BnApp
        .findOne({
            _id: idToSearch,
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate);

    if (!round) {
        round = await EvalRound
            .findOne({
                _id: idToSearch,
                active: false,
                consensus: { $exists: true },
            })
            .populate(defaultBnPopulate);
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

    let a = await BnApp
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: -1 })
        .limit(req.params.limit);

    let b = await EvalRound
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultBnPopulate)
        .sort({ createdAt: -1 })
        .limit(req.params.limit);

    res.json({ a, b });
});

/* POST set evals as complete */
router.post('/unarchive/:id', api.isNat, async (req, res) => {
    if (req.body.type == 'application') {
        let a = await BnApp.findById(req.params.id);

        if (!a || a.error) {
            return res.json({ error: 'Could not load evalRound!' });
        }

        let u = await User.findById(a.applicant);

        if (!u || u.error) {
            return res.json({ error: 'Could not load user!' });
        }

        if (a.consensus == 'pass') {
            await User.findByIdAndUpdate(u.id, {
                $pull: {
                    modes: a.mode,
                    probation: a.mode,
                },
            });
            await EvalRound.deleteManyByUserId(u.id);

            if (u.modes.length == 1) {
                await User.findByIdAndUpdate(u.id, {
                    group: 'user',
                    $pop: { bnDuration: 1 },
                });
            }
        }

        await BnApp.findByIdAndUpdate(a.id, { active: true });

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
        let er = await EvalRound.findById(req.params.id);

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
            await EvalRound.deleteManyByUserId(u.id);

            if (u.probation.indexOf(er.mode) < 0) {
                await User.findByIdAndUpdate(u.id, { $push: { probation: er.mode } });
            }
        }

        await EvalRound.findByIdAndUpdate(req.params.id, { active: true });

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
