const qs = require('querystring');

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
    let indexEnd = url.indexOf('/discussion#');
    let bmId;

    if (indexEnd !== -1) {
        bmId = url.slice(indexStart, indexEnd);
    } else {
        bmId = url.slice(indexStart);
    }

    return bmId;
}

/**
 * escape a query parameter
 * @param {string} param
 */
function safeParam(param) {
    return qs.escape(param);
}

/**
 * check if it's a valid url
 * @param {string} url
 * @param {string} contain url must contain ...
 * @returns {object} error | success
 */
function isValidUrl(url, contain) {
    // eslint-disable-next-line no-useless-escape
    const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!regexp.test(url) || url.indexOf(contain) == -1) {
        return { error: 'Not a valid URL' };
    } else {
        return { success: 'ok' };
    }
}

module.exports = { escapeUsername, getBeatmapsetIdFromUrl, safeParam, isValidUrl };
