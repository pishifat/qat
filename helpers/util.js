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
 * @param {string} [trail] ...
 */
function shorten(text, length, trail) {
    if (!text) return '';

    length = length || 50;

    if (text.length > length) {
        return text.slice(0, length) + (trail ? trail : '...');
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
 * Find days between two dates
 * @param {Date} date1
 * @param {Date} date2
 */
function findDaysBetweenDates (date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const days = Math.round((d1.getTime() - d2.getTime())/(1000*60*60*24));

    return days;
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

/**
 * Convert timestamps to links
 * @param {string} text
 */
function parseTimestamps(text) {
    const regex = /\s(\d+):(\d{2}):(\d{3})\s*(\(((\d+(\|)?,?)+)\))?\s/gim;
    const timestamps = text.match(regex);

    if (!timestamps) return text;

    for (const timestamp of timestamps) {
        const res = regex.exec(timestamp);
		regex.lastIndex = 0;
		if (!res) continue;

		let url = ` [${timestamp.trim()}](<osu://edit/${res[1]}:${res[2]}:${res[3]}`;

		if (res[4]) url += `-${res[4]}`;
        
		url += ">) ";

		text = text.replace(timestamp, url);
	}

	return text;  
}

module.exports = { escapeUsername, getBeatmapsetIdFromUrl, isValidUrl, isValidUrlOrThrow, shorten, sleep, findDaysBetweenDates, setSession, parseTimestamps };
