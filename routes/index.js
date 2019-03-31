const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const api = require('../models/api.js');
const users = require('../models/user.js');
const logs = require('../models/log.js');
const router = express.Router();

/* GET bn app page */
router.get('/', async (req, res, next) => {
    let isBnOrNat;
    let isBn;
    if (req.session.group == 'bn' || req.session.group == 'nat') {
        isBnOrNat = true;
        if (req.session.group == 'bn') isBn = true;
    }
    res.render('qatIndex', { title: 'NAT', layout: false, loggedInAs: req.session.mongoId, isBnOrNat: isBnOrNat, isBn: isBn});
});

/*-------below this line is the intimidating code that i never want to look at----------*/

/* GET 'login' to get user's info */
router.get('/login', async (req, res, next) => {
    if (req.session.osuId && req.session.username) {
        const u = await users.service.query({ osuId: req.session.osuId });
        if (!u || u.error) {
            const user = await users.service.create(
                req.session.osuId,
                req.session.username,
                req.session.group
            );
            
            if (user && !user.error) {
                req.session.mongoId = user._id;
                logs.service.create(req.session.mongoId, 
                    `Verified their account for the first time`);
                return next();
            } else {
                return res.status(500).render('error', { message: 'Something went wrong!' });
            }
        } else {
            req.session.mongoId = u._id;
            req.session.group = u.group;
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
}, api.isLoggedIn, (req, res) => {
    res.redirect('/');
});

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
        }else{
            req.session.group = 'user';
        }
        req.session.username = response.username;
        req.session.osuId = response.id;
        res.redirect('/login');
    }
});

module.exports = router;
