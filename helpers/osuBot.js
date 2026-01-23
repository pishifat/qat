const config = require('../config.json');
const { default: axios } = require('axios');
const util = require('./util');

let tokenInfo = {
    expiresAt: null,
    token: '',
};

/**
 * @returns {Promise<string | {error: string}>}>}
 */
async function getBotToken () {
    if (tokenInfo.expiresAt && tokenInfo.expiresAt > new Date()) {
        return tokenInfo.token;
    }

    try {
        const { data } = await axios.post('https://osu.ppy.sh/oauth/token', {
            grant_type: 'client_credentials',
            client_id: config.bot.id,
            client_secret: config.bot.secret,
            scope: 'delegate chat.write chat.write_manage',
        });

        tokenInfo = {
            expiresAt: new Date(Date.now() + data.expires_in * 1000), // expires_in = 86400 seconds
            token: data.access_token,
        };

        return data.access_token;
    } catch (error) {
        return { error };
    }
}

/**
 * @param {number} userId
 * @param {string} message
 * @returns {Promise<boolean | {error: string}>}
 */
async function sendMessage(userId, message) {
    const token = await getBotToken();

    await util.sleep(500); // prevent rate limiting

    if (typeof token !== 'string') {
        return { error: token.error };
    }

    try {
        await axios.post('https://osu.ppy.sh/api/v2/chat/new', {
            target_id: userId,
            message,
            is_action: false,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return true;
    } catch (error) {
        return { error };
    }
}

/**
 * @param {number} userId
 * @param {string[]} messages
 * @returns {Promise<boolean | {error: string}>}
 */
async function sendMessages(userId, messages) {
    for (const message of messages) {
        const res = await sendMessage(userId, message);

        if (typeof res !== 'boolean') {
            return {  error: res.error };
        }
    }

    return true;
}

/**
 * @param {number[]} userIds
 * @param {object} channel
 * @param {string} channel.name
 * @param {string} channel.description
 * @param {string} message
 */
async function sendAnnouncement(userIds, channel, message) {
    return { error: 'no message here' };
    const token = await getBotToken();

    await util.sleep(500); // prevent rate limiting

    if (typeof token !== 'string') {
        return { error: token.error };
    }

    try {
        await axios.post('https://osu.ppy.sh/api/v2/chat/channels/', {
            channel: {
                name: channel.name,
                description: channel.description,
            },
            message,
            target_ids: userIds,
            type: "ANNOUNCE",
        },
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return true;
    } catch (error) {
        return { error };
    }
}

module.exports = {
    sendMessage,
    sendMessages,
    sendAnnouncement,
};
