const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const api = require('../helpers/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;
const getUserModsCount = require('../helpers/helpers').getUserModsCount;
const router = express.Router();

/* GET bn app page */
router.get('/', async (req, res) => {
    const allUsersByMode = await usersService.getAllByMode(true, true, true);
    let user;

    if (req.session.mongoId) {
        user = await usersService.query({ _id: req.session.mongoId });
    }

    let isBnOrNat = user && user.isBnOrNat;
    let isBn = user && user.isBn && !user.isSpectator;
    let isNat = user && (user.isNat || user.isSpectator);

    res.render('qatIndex', {
        title: 'NAT',
        layout: false,
        loggedInAs: req.session.mongoId,
        isBnOrNat,
        isBn,
        isNat,
        allUsersByMode,
    });
});

/* GET mod count from specified user */
router.get('/modsCount/:user', async (req, res) => {
    if (!req.params.user || req.params.user.trim() == '') {
        return res.json({ error: 'Missing user input' });
    }

    const modCount = await getUserModsCount(req.params.user);
    if (modCount.error) return res.json(modCount.error);

    return res.json({ modCount });
});

/*-------below this line is the intimidating code that i never want to look at----------*/

/* GET 'login' to get user's info */
router.get(
    '/login',
    async (req, res, next) => {
        if (req.session.osuId && req.session.username) {
            const u = await usersService.query({ osuId: req.session.osuId });

            if (!u || u.error) {
                const user = await usersService.create(
                    req.session.osuId,
                    req.session.username,
                    req.session.group,
                    req.session.isSpectator
                );

                if (user && !user.error) {
                    req.session.mongoId = user._id;
                    logsService.create(req.session.mongoId, 'Verified their account for the first time');

                    return next();
                } else {
                    return res.status(500).render('error', { message: 'Something went wrong!' });
                }
            } else {
                if (u.username != req.session.username) {
                    await usersService.update(u._id, { username: req.session.username });
                    logsService.create(u._id, `Username changed from "${u.username}" to "${req.session.username}"`);
                }

                if (u.isSpectator != req.session.isSpectator) {
                    await usersService.update(u._id, { isSpectator: req.session.isSpectator });
                    logsService.create(u._id, `User toggled spectator role`);
                }

                if (u.group != req.session.group) {
                    await usersService.update(u._id, { group: req.session.group });
                    logsService.create(u._id, `User group changed to ${req.session.group.toUpperCase()}`);
                }

                req.session.mongoId = u._id;

                return next();
            }
        }

        if (!req.cookies._state) {
            crypto.randomBytes(48, function(err, buffer) {
                res.cookie('_state', buffer.toString('hex'), { httpOnly: true });
                res.redirect('/login');
            });
        } else {
            let hashedState = Buffer.from(req.cookies._state).toString('base64');
            res.redirect(
                `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
                    config.id
                }&redirect_uri=${encodeURIComponent(config.redirect)}&state=${hashedState}&scope=identify`
            );
        }
    },
    api.isLoggedIn,
    (req, res) => {
        if (req.session.lastPage) {
            res.redirect(req.session.lastPage);
        } else if (req.session.group == 'nat' || req.session.isSpectator) {
            res.redirect('/appeval');
        } else if (req.session.group == 'bn') {
            res.redirect('/qualityassurance');
        } else {
            res.redirect('/');
        }
    }
);

/* GET user's token and user's info to login */
router.get('/callback', async (req, res) => {
    if (!req.query.code || req.query.error) {
        return res.redirect('/');
    }

    const decodedState = Buffer.from(req.query.state, 'base64').toString('ascii');

    if (decodedState !== req.cookies._state) {
        res.clearCookie('_state');

        return res.status(403).render('error', { message: 'unauthorized' });
    }

    res.clearCookie('_state');
    let response = await api.getToken(req.query.code);

    if (response.error) {
        res.status(500).render('error', { message: response.error });
    } else {
        // *1000 because maxAge is miliseconds, oauth is seconds
        req.session.cookie.maxAge = response.expires_in * 2 * 1000;
        req.session.expireDate = Date.now() + (response.expires_in * 1000);
        req.session.accessToken = response.access_token;
        req.session.refreshToken = response.refresh_token;

        response = await api.getUserInfo(req.session.accessToken);

        if (response.error) {
            res.status(500).render('error');
        } else if (response.is_nat) {
            req.session.group = 'nat';
            req.session.isSpectator = false;
        } else {
            req.session.isSpectator = response.is_gmt;

            if (response.is_bng) {
                req.session.group = 'bn';
            } else {
                req.session.group = 'user';
            }
        }

        req.session.username = response.username;
        req.session.osuId = response.id;
        res.redirect('/login');
    }
});

/* GET redirect to mgsite */
router.get('/mgsite', (req, res) => {
    return res.redirect('https://mappersguild.com');
});

module.exports = router;
