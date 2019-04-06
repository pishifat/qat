const querystring = require('querystring');
const config = require('../config.json');
const users = require('./user.js');
const axios = require('axios');
const cheerio = require('cheerio');
const helper = require('../routes/helper');

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

async function beatmapsetInfo(setId) {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&s=${setId}`;
    
    try {
        const res = await axios.get(url);
        return res.data[0];
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

/**
 * Returns array with values per month ex: [1,1,1] or the calculated score ex: 7,77
 * @param {string} username 
 * @param {string} mode To calculate and return the score, pass this argument
 */
async function getUserModsCount(username, mode) {
    let baseUrl = `https://osu.ppy.sh/beatmapsets/events?limit=50&types[]=kudosu_gain&types[]=kudosu_lost&user=${username}`;
    let maxDate = new Date();
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    let modCount = [];
    let modScore = 0;
    let expectedMods = (mode && mode == 'osu' ? 4 : 3);
    // Loops for months
    for (let i = 0; i < 3; i++) {
        const maxDateStr = `${maxDate.getFullYear()}-${maxDate.getMonth() + 1}-${maxDate.getDate()}`;
        const minDateStr = `${minDate.getFullYear()}-${minDate.getMonth() + 1}-${minDate.getDate()}`;
        let urlWithDate = baseUrl + `&min_date=${minDateStr}&max_date=${maxDateStr}`;
        let monthMods = [];
        let hasEvents = true;
        let pageNumber = 1;
        // Loops through pages of a month
        while (hasEvents) {
            let finalUrl = urlWithDate + `&page=${pageNumber}`
            try {
                const historyHtml = await axios.get(finalUrl);
                const $ = cheerio.load(historyHtml.data);
                if (!$('.beatmapset-event').length) {
                    hasEvents = false;
                } else {
                    let pageMods = [];
                    $('.beatmapset-event').each(function(k, v) {            
                        const url = $(v).find('a').first().attr('href');
                        let mod = { 
                            beatmapset: helper.getBeatmapsetIdFromUrl(url),
                            url: url
                        };
                        
                        if ($(v).find('.beatmapset-event__icon--kudosu-gain').length) {
                            mod.isGain = true;
                        } else {
                            mod.isGain = false;
                        }
                        
                        pageMods.push(mod);
                    });
                    
                    // Filters repeated sets and checks for denied KDs
                    pageMods.forEach(mod => {
                        if (mod.isGain && 
                            pageMods.findIndex(m => m.url == mod.url && !m.isGain) === -1 && 
                            monthMods.findIndex(m => m.beatmapset == mod.beatmapset) === -1) {
                                monthMods.push(mod);
                        }
                    });
                }
            } catch (error) {
                console.log(error);
                return res.json({ error: error._message });
            }
    
            pageNumber ++;
        }
        
        modScore += Math.log(1 + monthMods.length) / Math.log(Math.sqrt(1 + expectedMods)) - (2 * (1 + expectedMods)) / (1 + monthMods.length);
        modCount.push(monthMods.length);
        minDate.setDate(minDate.getDate() - 30);
        maxDate.setDate(maxDate.getDate() - 30);
    }

    if (mode) {
        return modScore.toFixed(2);
    } else {
        return modCount;
    }
}

async function isLoggedIn(req, res, next) {
    if (req.session.mongoId) {
        const u = await users.service.query({ _id: req.session.mongoId });
        
        // If hidden, shouldn't be able to do anything
        if (!u || u.group == 'hidden') {
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

module.exports = { isLoggedIn, getToken, getUserInfo, getUserModsCount, beatmapsetInfo, isBnOrNat, isNat };
