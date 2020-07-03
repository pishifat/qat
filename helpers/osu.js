const querystring = require('querystring');
const config = require('../config.json');
const { default: axios } = require('axios');

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

module.exports = {
    getToken,
    refreshToken,
    getUserInfo,
};
