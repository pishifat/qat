const querystring = require('querystring');
const config = require('../config.json');
const users = require('../models/user.js');
const axios = require('axios');
const logsService = require('../models/log').service;

async function getToken(code) {
    const postData = querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirect,
        client_id: config.id,
        client_secret: config.secret,
    });

    const options = {
        method: 'post',
        url: 'https://osu.ppy.sh/oauth/token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: postData,
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error };
    }
}

async function refreshToken(refreshToken) {
    const postData = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: config.id,
        client_secret: config.secret,
        refresh_token: refreshToken,
    });

    const options = { 
        method: 'POST', 
        url: 'https://osu.ppy.sh/oauth/token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: postData,
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error };
    }
}

async function getUserInfo(token) {
    const options = { 
        method: 'GET',
        url: 'https://osu.ppy.sh/api/v2/me',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error };
    }
}

async function beatmapsetOwnerMaps(userId) {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&u=${userId}`;
    
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

async function beatmapsetInfo(setId, allDiffs) {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&s=${setId}`;
    
    try {
        const res = await axios.get(url);
        if(!allDiffs){
            return res.data[0];
        }else{
            return res.data;
        }
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

async function isLoggedIn(req, res, next) {
    if (req.session.mongoId) {
        const u = await users.service.query({ _id: req.session.mongoId });
        if (!u) {
            return res.redirect('/');
        }

        // Refresh if less than 10 hours left
        if (new Date() > new Date(req.session.expireDate - (10 * 3600 * 1000))) {
            const response = await refreshToken(req.session.refreshToken);
            if (!response || response.error) {
                req.session.destroy();
                res.redirect('/');
            }
            
            // *1000 because maxAge is miliseconds, oauth is seconds
            req.session.cookie.maxAge = response.expires_in * 2 * 1000;
            req.session.expireDate = Date.now() + (response.expires_in * 1000);
            req.session.accessToken = response.access_token;
            req.session.refreshToken = response.refresh_token;
        }

        res.locals.userRequest = u;
        next();
    } else {
        res.redirect('/');
    }
}

function isBnOrNat(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.group == 'bn' || u.group == 'nat' || u.isSpectator) {
        next();
    } else {
        res.redirect('/');
    }
}

function isBn(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.group == 'bn') {
        next();
    } else {
        res.redirect('/');
    }
}

function isNat(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.group == 'nat' || u.isSpectator) {
        next();
    } else {
        res.redirect('/');
    }
}

function isLeader(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.isLeader) {
        next();
    } else {
        res.redirect('/');
    }
}

function isBnEvaluator(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.isBnEvaluator || u.group == 'nat') {
        next();
    } else {
        res.redirect('/');
    }
}

function isNotSpectator(req, res, next) {
    const u = res.locals.userRequest;
    
    if (!u.isSpectator) {
        next();
    } else {
        return res.json({ error: 'Spectators cannot perform this action!' });
    }
}

async function webhookPost(message, mode) {
    let url = 'https://discordapp.com/api/webhooks/';

    switch (mode) {
        case 'osu':
            url += `${config.standardWebhook.id}/${config.standardWebhook.token}`;
            break;
        case 'taiko':
            url += `${config.taikoWebhook.id}/${config.taikoWebhook.token}`;
            break;
        case 'catch':
            url += `${config.catchWebhook.id}/${config.catchWebhook.token}`;
            break;
        case 'mania':
            url += `${config.maniaWebhook.id}/${config.maniaWebhook.token}`;
            break;
        case 'all':
            url += `${config.allWebhook.id}/${config.allWebhook.token}`;
            break;
        default:
            url += `${config.reportWebhook.id}/${config.reportWebhook.token}`;
            break;
    }

    try {
        await axios.post(url, {
            embeds: message,
        });
    } catch (error) {
        logsService.create(null, error, true);
    }
}

async function highlightWebhookPost(message, mode) {
    let url = 'https://discordapp.com/api/webhooks/';
    let role;

    switch (mode) {
        case 'osu':
            url += `${config.standardWebhook.id}/${config.standardWebhook.token}`;
            role = '<@' + config.standardWebhook.role + '>';
            break;
        case 'taiko':
            url += `${config.taikoWebhook.id}/${config.taikoWebhook.token}`;
            role = '<@' + config.taikoWebhook.role + '>';
            break;
        case 'catch':
            url += `${config.catchWebhook.id}/${config.catchWebhook.token}`;
            role = '<@' + config.catchWebhook.role + '>';
            break;
        case 'mania':
            url += `${config.maniaWebhook.id}/${config.maniaWebhook.token}`;
            role = '<@' + config.maniaWebhook.role + '>';
            break;
        default:
            url += `${config.reportWebhook.id}/${config.reportWebhook.token}`;
            break;
    }

    try {
        await axios.post(url, {
            content: role + ' ' + message,
        });
    } catch (error) {
        logsService.create(null, error, true);
    }
}

module.exports = { isLoggedIn, getToken, getUserInfo, beatmapsetInfo, beatmapsetOwnerMaps, isBnOrNat, isBn, isNat, isLeader, isBnEvaluator, isNotSpectator, webhookPost, highlightWebhookPost };
