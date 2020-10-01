const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const { getUserModsCount } = require('../helpers/scrap');
const middlewares = require('../helpers/middlewares');
const osu = require('../helpers/osu');
const User = require('../models/user');
const Logger = require('../models/log');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { setSession } = require('../helpers/util');
const { OsuResponseError } = require('../helpers/errors');
const { ResignationConsensus } = require('../shared/enums');

const router = express.Router();

/* GET index bn listing */
router.get('/relevantInfo', async (req, res) => {
    res.json({
        allUsersByMode: await User.getAllByMode(true, true, true),
    });
});

/* GET my info */
router.get('/me', middlewares.isLoggedIn, (req, res) => {
    res.json({
        me: res.locals.userRequest,
    });
});

/* GET mod count from specified user */
router.get('/modsCount/:user/:mode', async (req, res) => {
    const userInput = req.params.user && req.params.user.trim();
    const modeInput = req.params.mode && req.params.mode.trim();

    if (!userInput || !modeInput) {
        return res.json({ error: 'Missing user input' });
    }

    const user = await User.findByUsernameOrOsuId(userInput).select('_id history');
    let months = 3;

    if (user) {
        const wasBn = user.history && user.history.length;
        const lastEvaluation = await ResignationEvaluation
            .findOne({
                user: user._id,
                mode: modeInput,
            })
            .sort({ updatedAt: -1 });

        if (lastEvaluation && lastEvaluation.consensus === ResignationConsensus.ResignedOnGoodTerms) months = 1;
        else if (wasBn) months = 2;
    }

    const modCount = await getUserModsCount(userInput, months);

    if (!modCount.length) {
        return res.json({
            error: `Couldn't calculate your score`,
        });
    }

    return res.json({
        modCount,
        months,
    });
});

/* GET 'login' to get user's info */
router.get('/login', (req, res) => {
    const state = crypto.randomBytes(48).toString('hex');
    res.cookie('_state', state, { httpOnly: true });
    const hashedState = Buffer.from(state).toString('base64');

    if (!req.session.lastPage) {
        req.session.lastPage = req.get('referer');
    }

    res.redirect(
        `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
            config.id
        }&redirect_uri=${encodeURIComponent(config.redirect)}&state=${hashedState}&scope=identify+public`
    );
});

/* GET destroy session */
router.get('/logout', async (req, res) => {
    await req.session.destroy();
    res.redirect('/');
});

/* GET user's token and user's info to login */
router.get('/callback', async (req, res) => {
    if (!req.query.code || req.query.error) {
        return res.status(500).render('error', { message: req.query.error || 'Something went wrong' });
    }

    const decodedState = Buffer.from(req.query.state, 'base64').toString('ascii');
    const savedState = req.cookies._state;
    res.clearCookie('_state');

    if (decodedState !== savedState) {
        return res.status(403).render('error', { message: 'unauthorized' });
    }

    let response = await osu.getToken(req.query.code);

    if (response.error) {
        throw new OsuResponseError(response, 'Error on getting token');
    } else {
        setSession(req.session, response);
        response = await osu.getUserInfo(req.session.accessToken);

        if (response.error) {
            req.session.destroy();
            throw new OsuResponseError(response, 'Error on getting user info');
        }

        const groupIds = response.groups.map(g => g.id);
        const groups = ['user'];

        if (groupIds.includes(7)) {
            groups.push('nat');
        }

        if (groupIds.includes(28) || groupIds.includes(32)) {
            groups.push('bn');
        }

        if (groupIds.includes(4) || groupIds.includes(11)) {
            groups.push('gmt');
        }

        const osuId = response.id;
        const username = response.username;
        const rankedBeatmapsets = response.ranked_and_approved_beatmapset_count;
        const user = await User.findOne({ osuId });

        if (!user) {
            const newUser = new User();
            newUser.osuId = osuId;
            newUser.username = username;
            newUser.groups = groups;
            newUser.rankedBeatmapsets = rankedBeatmapsets;
            await newUser.save();

            req.session.mongoId = newUser._id;
            Logger.generate(
                req.session.mongoId,
                'Verified their account for the first time',
                'account',
                req.session.mongoId
            );
        } else {
            if (user.username != username) {
                user.username = username;
                await user.save();
                Logger.generate(
                    user._id,
                    `Username changed from "${user.username}" to "${response.username}"`,
                    'account',
                    user._id
                );
            }

            if (user.rankedBeatmapsets != rankedBeatmapsets) {
                user.rankedBeatmapsets = rankedBeatmapsets;
                await user.save();
            }

            if (groups.some(g => !user.groups.includes(g)) || user.groups.some(g => !groups.includes(g))) {
                if (!user.groups.includes('gmt') && groups.includes('gmt')) {
                    Logger.generate(
                        user._id,
                        `User toggled on spectator role`,
                        'account',
                        user._id
                    );
                }

                user.groups = groups;
                await user.save();
                Logger.generate(
                    user._id,
                    `User groups changed to ${groups.join(', ')}`,
                    'account',
                    user._id
                );
            }

            req.session.mongoId = user._id;
        }

        req.session.osuId = osuId;
        req.session.username = username;

        const lastPage = req.session.lastPage;
        req.session.lastPage = undefined;
        res.redirect(lastPage || '/');
    }
});

module.exports = router;
