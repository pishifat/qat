const querystring = require('querystring');
const config = require('../config.json');
const users = require('./user.js');
const axios = require('axios');

async function getToken(code) {
    const postData = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirect,
        client_id: config.id,
        client_secret: config.secret
    });

    const options = {
        method: 'post',
        url: 'https://osu.ppy.sh/oauth/token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: postData
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error: error };
    }
}

async function refreshToken(refreshToken) {
    const postData = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: config.id,
        client_secret: config.secret,
        refresh_token: refreshToken
    });

    const options = { 
        method: 'POST', 
        url: 'https://osu.ppy.sh/oauth/token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: postData
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error: error };
    }
}

async function getUserInfo(token) {
    const options = { 
        method: 'GET',
        url: 'https://osu.ppy.sh/api/v2/me',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };

    try {
        const res = await axios(options);
        return res.data;
    } catch (error) {
        return { error: error };
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

        // Refresh if less than 30 sec left
        if (req.session.cookie.maxAge < 30000) {
            const response = await refreshToken();
            req.session.cookie.maxAge = response.expires_in * 1000;
            req.session.accessToken = response.access_token;
            req.session.refreshToken = response.refresh_token;
        }

        res.locals.userRequest = u;
        next();
    } else {
        res.redirect('/');
    }
}

async function isBnOrNat(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.group == 'bn' || u.group == 'nat') {
        next();
    } else {
        res.redirect('/');
    }
}

async function isNat(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.group == 'nat') {
        next();
    } else {
        res.redirect('/');
    }
}

async function isLeader(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.isLeader) {
        next();
    } else {
        res.redirect('/');
    }
}

async function isBnEvaluator(req, res, next) {
    const u = res.locals.userRequest;
    
    if (u.isBnEvaluator || u.group == 'nat') {
        next();
    } else {
        res.redirect('/');
    }
}

module.exports = { isLoggedIn, getToken, getUserInfo, beatmapsetInfo, beatmapsetOwnerMaps, isBnOrNat, isNat, isLeader, isBnEvaluator };
