const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const User = require('../../models/user');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

//population
const defaultAppPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'test', select: 'totalScore comment' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

const defaultBnPopulate = [
    {
        path: 'user',
        select: 'username osuId probation modes',
    },
    {
        path: 'natEvaluators',
        select: 'username osuId',
    },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId group',
        },
    },
];

/* GET search for user */
router.get('/search', async (req, res) => {
    const userToSearch = req.query.user && decodeURI(req.query.user);
    const idToSearch = req.query.id;

    let limit = parseInt(req.query.limit) || 12;

    let bnApplicationsQuery = AppEvaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultAppPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

    let evalRoundsQuery = BnEvaluation
        .find({
            active: false,
            consensus: { $exists: true },
        })
        .populate(defaultBnPopulate)
        .sort({ createdAt: -1 })
        .limit(limit);

    if (userToSearch) {
        let user;

        if (isNaN(userToSearch)) {
            user = await User.findByUsername(userToSearch);
        } else {
            user = await User.findOne({ osuId: parseInt(userToSearch) });
        }

        if (!user) {
            return res.json({ error: 'Cannot find user!' });
        }

        bnApplicationsQuery.where('user', user.id);
        evalRoundsQuery.where('user', user.id);
    }

    if (idToSearch) {
        bnApplicationsQuery.where('_id', idToSearch);
        evalRoundsQuery.where('_id', idToSearch);
    }

    const [bnApplications, evalRounds] = await Promise.all([
        bnApplicationsQuery,
        evalRoundsQuery,
    ]);

    res.json({
        bnApplications,
        evalRounds,
    });
});

/* POST set evals as complete */
router.post('/unarchive/:id', async (req, res) => {
    if (req.body.type == 'application') {
        let a = await AppEvaluation.findById(req.params.id);

        if (!a || a.error) {
            return res.json({ error: 'Could not load evaluation!' });
        }

        let u = await User.findById(a.user);

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
            await BnEvaluation.deleteManyByUserId(u.id);

            if (u.modes.length == 1) {
                await User.findByIdAndUpdate(u.id, {
                    group: 'user',
                    $pop: { bnDuration: 1 },
                });
            }
        }

        await AppEvaluation.findByIdAndUpdate(a.id, { active: true });

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.white,
                description: `Un-archived [**${u.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${a.id})`,
            }],
            a.mode
        );

    } else if (req.body.type == 'currentBn') {
        let er = await BnEvaluation.findById(req.params.id);

        if (!er || er.error) {
            return res.json({ error: 'Could not load evaluation!' });
        }

        let u = await User.findById(er.user);

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

        if (er.consensus == 'probation' || er.consensus == 'pass') {
            await BnEvaluation.deleteManyByUserId(u.id);

            if (u.probation.indexOf(er.mode) < 0) {
                await User.findByIdAndUpdate(u.id, { $push: { probation: er.mode } });
            }
        }

        await BnEvaluation.findByIdAndUpdate(req.params.id, { active: true });

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.white,
                description: `Un-archived [**${u.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${er.id})`,
            }],
            er.mode
        );
    }

    res.json({ success: 'ok' });
});

module.exports = router;
