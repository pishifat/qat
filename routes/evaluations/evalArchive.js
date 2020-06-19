const express = require('express');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const User = require('../../models/user');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

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
            select: 'username osuId groups',
        },
    },
];

const defaultBnPopulate = [
    {
        path: 'user',
        select: 'username osuId modesInfo',
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
            select: 'username osuId groups',
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

/* POST unarchive application evaluation */
router.post('/:id/unarchiveApp', async (req, res) => {
    let app = await AppEvaluation.findById(req.params.id).orFail();
    let user = await User.findById(app.user).orFail();

    // Remove join history, user modes and BN group if not hybrid
    if (app.consensus == 'pass') {
        // TODO find somehow the actual history, relatedEvaluation === evaluation._id?
        user.history.pop();
        let i = user.modesInfo.findIndex(m => m.mode === app.mode);

        if (i !== -1) {
            user.modesInfo.splice(i, 1);
        }

        if (!user.modesInfo.length) {
            i = user.groups.findIndex(g => g === 'bn');

            if (i !== -1) {
                user.groups.splice(i, 1);
            }
        }

        await Promise.all([
            user.save(),
            BnEvaluation.deleteUserActiveEvaluations(user.id),
        ]);
    }

    await AppEvaluation.findByIdAndUpdate(app.id, { active: true });

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.white,
            description: `Un-archived [**${user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id})`,
        }],
        app.mode
    );

    res.json({ success: 'ok' });
});

function resetHistory (user, wasMovedToNat) {
    // remove left & join
    user.history.pop();
    user.history.pop();

    const i = user.groups.findIndex(g => g === (wasMovedToNat ? 'nat' : 'bn'));
    user.groups.splice(i, 1, (wasMovedToNat ? 'bn' : 'nat'));

    return user;
}

/* POST unarchive bn evaluation */
router.post('/:id/unarchiveBn', async (req, res) => {
    let evaluation = await BnEvaluation.findById(req.params.id).orFail();
    let user = await User.findById(evaluation.user).orFail();

    // Remove left history. Add mode and BN group back if not hybrid
    if (evaluation.consensus == 'fail') {
        // TODO find somehow the actual history, relatedEvaluation === evaluation._id?
        user.history.pop();

        if (!user.isBn) {
            user.groups.push('bn');
        }

        if (!user.isBnFor(evaluation.mode)) {
            user.modesInfo.push({
                mode: evaluation.mode,
                level: 'probation',
            });
        }

    // Change mode to probation and restore group if needed
    } else if (evaluation.consensus == 'probation' || evaluation.consensus == 'pass') {
        await BnEvaluation.deleteUserActiveEvaluations(user.id);

        const i = user.modesInfo.findIndex(m => m.mode == evaluation.mode);

        if (i !== -1) {
            user.modesInfo.splice(i, 1);
        }

        user.modesInfo.push({
            mode: evaluation.mode,
            level: 'probation',
        });

        if (evaluation.isMoveToNat) {
            user = resetHistory(user, true);
        } else if (evaluation.isMoveToBn) {
            user = resetHistory(user, false);
        }
    }

    await Promise.all([
        user.save(),
        BnEvaluation.findByIdAndUpdate(req.params.id, { active: true }),
    ]);

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.white,
            description: `Un-archived [**${user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
        }],
        evaluation.mode
    );

    res.json({ success: 'ok' });
});

module.exports = router;
