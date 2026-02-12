const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const { getUserModsCount } = require('../helpers/scrap');
const middlewares = require('../helpers/middlewares');
const osu = require('../helpers/osu');
const discord = require('../helpers/discord');
const osuBot = require('../helpers/osuBot');
const util = require('../helpers/util');
const User = require('../models/user');
const Logger = require('../models/log');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { setSession } = require('../helpers/util');
const { OsuResponseError } = require('../helpers/errors');
const { ResignationConsensus } = require('../shared/enums');
const Announcement = require('../models/announcement');

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

    const modCount = await getUserModsCount(req.session.accessToken, userInput, months);

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

/* GET announcements */
router.get('/findAnnouncements', async (req, res) => {
    const limit = parseInt(req.query.limit);

    let announcements = await Announcement
        .find({})
        .limit(limit)
        .sort({ createdAt: -1 });

    if (!announcements) {
        return res.json({ none: 'no announcement' });
    }

    return res.json(announcements);
});

/* POST update announcement */
router.post('/updateAnnouncement/:id', async (req, res) => {
    const user = await User.findById(req.session.mongoId); // can't use middleware for reasons that i don't care to figure out, so this is the alternative

    if (!user.isNat) {
        return res.json({ error: `You can't use this` });
    }

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { title: req.body.newTitle, content: req.body.newContent });

    Logger.generate(
        req.session.mongoId,
        `Updated an announcement`,
        'spam',
        announcement._id
    );

    return res.json(announcement);
});

/* GET 'login' to get user's info */
router.get('/login', (req, res) => {
    const state = crypto.randomBytes(48).toString('base64');

    req.session._state = {
        state,
        redirectUrl: req.get('referer'),
    };

    res.redirect(
        'https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=' + config.oauth.id +
        '&redirect_uri=' + encodeURIComponent(config.oauth.redirect) +
        '&state=' + encodeURIComponent(state) +
        '&scope=identify+public'
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

    const decodedState = decodeURIComponent(req.query.state);
    const savedState = {
        ...req.session._state,
    };
    req.session._state = undefined;

    if (decodedState !== savedState.state) {
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
        } else if (groupIds.includes(28) || groupIds.includes(32)) {
            groups.push('bn');
        }

        if (groupIds.includes(4) || groupIds.includes(11)) {
            groups.push('gmt');
        }

        const osuId = response.id;
        const username = response.username;
        const cover = response.cover.url;
        const rankedBeatmapsets = response.ranked_and_approved_beatmapset_count;
        const user = await User.findOne({ osuId });

        if (!user) {
            const newUser = new User();
            newUser.osuId = osuId;
            newUser.username = username;
            newUser.cover = cover;
            newUser.groups = groups;
            newUser.rankedBeatmapsets = rankedBeatmapsets;
            newUser.countryCode = response.country_code;
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
                Logger.generate(
                    user._id,
                    `Username changed from "${user.username}" to "${response.username}"`,
                    user.groups.length > 1 ? 'notableNameChanges' : 'account',
                    user._id
                );

                user.username = username;
                await user.save();
            }

            if (user.rankedBeatmapsets != rankedBeatmapsets) {
                user.rankedBeatmapsets = rankedBeatmapsets;
                await user.save();
            }

            if (!user.cover || user.cover != cover) {
                user.cover = cover;
                await user.save();
            }

            if (!user.countryCode || user.countryCode != response.country_code) {
                user.countryCode = response.country_code;
                await user.save();
            }

            if (groups.some(g => !user.groups.includes(g)) || user.groups.some(g => !groups.includes(g))) {
                if (!user.groups.includes('gmt') && groups.includes('gmt') && !groups.includes('bn') && !groups.includes('nat')) {
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

            // toggle isActiveContentReviewer to false if user is not in gmt or nat
            if (!groups.includes('gmt') && !groups.includes('nat')) {
                if (user.isActiveContentReviewer) {
                    user.isActiveContentReviewer = false;
                    await user.save();
                }
            }

            // ensure correct groups for debugging users after re-log
            if (user.isPishifat && !user.modesInfo.length) {
                const modesInfo = [];

                for (const group of response.groups) {
                    if ((group.id == 7 || group.id == 28 || group.id == 32) && group.playmodes && group.playmodes.length) {
                        modesInfo.push({
                            mode: group.playmodes[0] == 'fruits' ? 'catch' : group.playmodes[0],
                            level: 'full'
                        });
                    }
                }

                user.modesInfo = modesInfo;
                await user.save();
            } else if (user.isPishifat) {
                user.modesInfo = [{
                    mode: 'none',
                    level: 'evaluator',
                }];

                await user.save();
            }

            req.session.mongoId = user._id;
        }

        req.session.osuId = osuId;
        req.session.username = username;
        req.session.groups = groups;

        res.redirect(savedState.redirectUrl || '/');
    }
});

module.exports = router;
