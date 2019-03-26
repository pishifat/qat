const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const api = require('../models/api.js');
const bnApps = require('../models/bnApp.js');
const users = require('../models/qatUser.js');

const router = express.Router();

/* GET bn app page */
router.get('/', async (req, res, next) => {
    let isBnOrQat;
    let isBn;
    if (req.session.qatGroup == 'bn' || req.session.qatGroup == 'qat') {
        isBnOrQat = true;
        if (req.session.qatGroup == 'bn') isBn = true;
    }
    res.render('qatIndex', { title: 'stuff', layout: false, loggedInAs: req.session.qatMongoId, isBnOrQat: isBnOrQat, isBn: isBn});
});

/*-------below this line is the intimidating code that i never want to look at----------*/

/* GET 'login' to get user's info */
router.get('/login', async (req, res, next) => {
    if (req.session.qatOsuId && req.session.qatUsername) {
        const u = await users.service.query({ osuId: req.session.qatOsuId });
        if (!u || u.error) {
            const user = await users.service.create(
                req.session.qatOsuId,
                req.session.qatUsername,
                req.session.qatGroup
            );

            if (user && !user.error) {
                req.session.qatMongoId = user._id;
                return next();
            } else {
                return res.status(500).render('error', { message: 'Something went wrong!' });
            }
        } else {
            req.session.qatMongoId = u._id;
            req.session.qatGroup = u.group;
            return next();
        }
    }

    if (!req.cookies._state) {
        crypto.randomBytes(48, function(err, buffer) {
            res.cookie('_state', buffer.toString('hex'), { httpOnly: true });
            res.redirect('/qat/login');
        });
    } else {
        let hashedState = Buffer.from(req.cookies._state).toString('base64');
        res.redirect(
            `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
                config.qat.id
            }&redirect_uri=${encodeURIComponent(config.qat.redirect)}&state=${hashedState}&scope=identify`
        );
    }
}, api.isLoggedIn, (req, res) => {
    res.redirect('/qat');
});

/* GET user's token and user's info to login */
router.get('/callback', async (req, res) => {
    console.log('callback')
    if (!req.query.code || req.query.error) {
        return res.redirect('/qat');
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
        req.session.qatAccessToken = response.access_token;
        req.session.qatRefreshToken = response.refresh_token;

        response = await api.getUserInfo(req.session.qatAccessToken);
        if (response.error) {
            res.status(500).render('error');
        } else if (response.is_qat) {
            req.session.qatGroup = 'qat';
        } else if (response.is_bng) {
            req.session.qatGroup = 'bn';
        }
        if (response.ranked_and_approved_beatmapset_count >= 64 && response.kudosu.total >= 0) {
            // todo also check if user is qat/bn
            req.session.qatUsername = response.username;
            req.session.qatOsuId = response.id;
            res.redirect('/qat/login');
        } else {
            res.render('error', { message: 'bottom text' });
        }
    }
});

module.exports = router;
