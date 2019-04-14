const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const api = require('../models/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;
const router = express.Router();

/* GET bn app page */
router.get('/', async (req, res, next) => {
    const allUsersByMode = await usersService.getAllByMode(true, true, true);
    
    let user;

    if (req.session.mongoId) {
        user = await usersService.query({ _id: req.session.mongoId });
    }

    let isBnOrNat;
    let isBn;
    if (user && (user.group == 'bn' || user.group == 'nat')) {
        isBnOrNat = true;
        if (user.group == 'bn') isBn = true;
    }
    res.render('qatIndex', {
        title: 'NAT',
        layout: false,
        loggedInAs: req.session.mongoId,
        isBnOrNat: isBnOrNat,
        isBn: isBn,
        allUsersByMode: allUsersByMode,
    });
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
                    req.session.group
                );

                if (user && !user.error) {
                    req.session.mongoId = user._id;
                    logsService.create(req.session.mongoId, `Verified their account for the first time`);
                    return next();
                } else {
                    return res.status(500).render('error', { message: 'Something went wrong!' });
                }
            } else {
                if (u.username != req.session.username) {
                    await usersService.update(u._id, { username: req.session.username });
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
        res.redirect('/');
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
        req.session.cookie.maxAge = response.expires_in * 1000;
        req.session.accessToken = response.access_token;
        req.session.refreshToken = response.refresh_token;

        response = await api.getUserInfo(req.session.accessToken);
        if (response.error) {
            res.status(500).render('error');
        } else if (response.is_qat) {
            req.session.group = 'nat';
        } else if (response.is_bng) {
            req.session.group = 'bn';
        } else {
            req.session.group = 'user';
        }
        req.session.username = response.username;
        req.session.osuId = response.id;
        res.redirect('/login');
    }
});

module.exports = router;
