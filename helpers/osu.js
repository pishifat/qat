const querystring = require('querystring');
const config = require('../config.json');
const { default: axios } = require('axios');

async function getToken(code) {
    const postData = querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.oauth.redirect,
        client_id: config.oauth.id,
        client_secret: config.oauth.secret,
    });

    /** @type {import('axios').AxiosRequestConfig} */
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
        client_id: config.oauth.id,
        client_secret: config.oauth.secret,
        refresh_token: refreshToken,
    });

    /** @type {import('axios').AxiosRequestConfig} */
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

async function getClientCredentialsGrant() {
    const postData = querystring.stringify({
        grant_type: 'client_credentials',
        client_id: config.oauth.id,
        client_secret: config.oauth.secret,
        scope: 'public',
    });

    /** @type {import('axios').AxiosRequestConfig} */
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

async function getUserInfo(token) {
    /** @type {import('axios').AxiosRequestConfig} */
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

async function getOtherUserInfo(token, osuId) {
    /** @type {import('axios').AxiosRequestConfig} */
    const options = {
        method: 'GET',
        url: `https://osu.ppy.sh/api/v2/users/${osuId}`,
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

async function getBeatmapsetInfo(token, setId) {
    /** @type {import('axios').AxiosRequestConfig} */
    const options = {
        method: 'GET',
        url: `https://osu.ppy.sh/api/v2/beatmapsets/${setId}`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    return (await axios(options)).data;
}

async function getDiscussions(token, params) {
    let url = `https://osu.ppy.sh/api/v2/beatmapsets/discussions${params}`;

    /** @type {import('axios').AxiosRequestConfig} */
    const options = {
        method: 'GET',
        url,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    return (await axios(options)).data;
}

module.exports = {
    getToken,
    refreshToken,
    getClientCredentialsGrant,
    getUserInfo,
    getOtherUserInfo,
    getBeatmapsetInfo,
    getDiscussions,
};
