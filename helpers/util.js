const moment = require('moment');

/**
 * Just replaces () and [] for now..
 * @param {string} username
 */
function escapeUsername(username) {
    username = username.trim();

    return username.replace(/[()[\]]/g, '\\$&');
}

/**
 *
 * @param {string} url ex: https://osu.ppy.sh/beatmapsets/930028/discussion#/893132
 */
function getBeatmapsetIdFromUrl(url) {
    let indexStart = url.indexOf('beatmapsets/') + 'beatmapsets/'.length;
    let indexEnd = url.indexOf('/discussion');
    let bmId;

    if (indexEnd !== -1) {
        bmId = url.slice(indexStart, indexEnd);
    } else {
        bmId = url.slice(indexStart);
    }

    return bmId;
}

/**
 * check if it's a valid url
 * @param {string} url
 * @param {string} [contain] url must contain ...
 * @returns {boolean}
 */
function isValidUrl(url, contain) {
    const regexp = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;

    if (!regexp.test(url) || (contain && !url.includes(contain))) {
        return false;
    } else {
        return true;
    }
}

/**
 * check if it's a valid url and throws an error if not
 * @param {string} url
 * @param {string} [contain] url must contain ...
 * @param {string} [throwMessage] error message
 * @returns {void}
 */
function isValidUrlOrThrow(url, contain, throwMessage) {
    if (!isValidUrl(url, contain)) {
        throw new Error(throwMessage || 'Not a valid URL');
    }
}

/**
 * Shorten text to a specific length if needed
 * @param {string} text
 * @param {number} [length] 50 by default
 */
function shorten(text, length) {
    if (!text) return '';

    length = length || 50;

    if (text.length > length) {
        return text.slice(0, length) + '...';
    }

    return text;
}

/**
 * Halt a process
 * @param {number} ms
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Set tokens and session age
 * @param {object} session
 * @param {object} response
 */
function setSession(session, response) {
    // *1000 because maxAge is miliseconds, oauth is seconds
    session.cookie.maxAge = moment.duration(7, 'days').asMilliseconds();
    session.expireDate = Date.now() + (response.expires_in * 1000);
    session.accessToken = response.access_token;
    session.refreshToken = response.refresh_token;
}

module.exports = { escapeUsername, getBeatmapsetIdFromUrl, isValidUrl, isValidUrlOrThrow, shorten, sleep, setSession };
