const moment = require('moment');
const mongoose = require('mongoose');

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
    const regexp = /^(?:(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/;

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
 * Invalidates a given user's sessions, forcing them to re-login
 * @param {string} mongoId 
 */
async function invalidateSessions(mongoId) {
    const sessionsCollection = mongoose.connection.collection("sessions");

    const result = await sessionsCollection.deleteMany({
        session: {
            $regex: mongoId,
            $options: "i",
        },
    });
}

/**
 * Shuffle an array
 * @param {Array} array
 */
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * @param {string} field
 * @returns {string}
 */
function makeWordFromField (field) {
    if (!field) return 'none';

    // Bn --> BN
    let word = field.replace(/Bn/,'BN');
    // Nat --> NAT
    word = word.replace(/Nat/,'NAT');
    // aWordWithBNOnIt --> a Word With BNOn It
    word = word.replace(/([a-z])([A-Z])/g, '$1 $2');
    // a Word With BNOn It --> a Word With BN On It
    word = word.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    // capitalize
    word = word.charAt(0).toUpperCase() + word.slice(1);

    return word;
}

/**
 * @param {number} days
 */
function yearsDuration(days) {
    return Math.floor(days / 365);
}

/**
 * formats a mode string
 * @param {string} mode
 * @returns {string}
 * 
 * @example
 * formatMode('osu'); // returns 'osu!'
 * formatMode('taiko'); // returns 'osu!taiko'
 * formatMode('none'); // returns 'structural'
 */
function formatMode(mode) {
    if (!mode) return '';

    if (mode == 'none') return 'structural';
    else if (mode == 'osu') return 'osu!';
    else if (mode == 'fruits') return 'osu!catch';
    else return 'osu!' + mode;
}

module.exports = {
    escapeUsername,
    getBeatmapsetIdFromUrl,
    isValidUrl,
    isValidUrlOrThrow,
    shorten,
    sleep,
    findDaysBetweenDates,
    setSession,
    invalidateSessions,
    shuffleArray,
    makeWordFromField,
    yearsDuration,
    formatMode,
};
