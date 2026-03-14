const moment = require('moment');
const mongoose = require('mongoose');

/**
 * Escape username for safe use inside a RegExp (e.g. ^escaped$).
 * Escapes all regex metacharacters so the value is matched literally and cannot alter the regex.
 * @param {string} username
 * @returns {string}
 */
function escapeUsername(username) {
    username = username.trim();

    return username.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

/**
 * Escape special regex characters for safe use in MongoDB $regex (or other RegExp).
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/\\/g, '\\\\').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 *
 * @param {string} url ex: https://osu.ppy.sh/beatmapsets/930028/discussion#/893132
 */
function getBeatmapsetIdFromUrl(url) {
    const indexStart = url.indexOf('beatmapsets/') + 'beatmapsets/'.length;
    const iDiscussion = url.indexOf('/discussion');
    const iHash = url.indexOf('#');
    const indexEndCandidates = [iDiscussion, iHash, url.length].filter(i => i !== -1);
    const indexEnd = Math.min(...indexEndCandidates);
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
    const sessionsCollection = mongoose.connection.collection('sessions');

    const result = await sessionsCollection.deleteMany({
        session: {
            $regex: mongoId,
            $options: 'i',
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
 * Check if a string is a valid MongoDB ObjectId (24 hex chars).
 * Use before findById/findByIdAndUpdate to avoid CastError on invalid ids.
 * Accepts string or Mongoose ObjectId.
 * @param {string|import('mongoose').Types.ObjectId} id
 * @returns {boolean}
 */
function isValidMongoId(id) {
    if (id == null) return false;
    const s = typeof id === 'string' ? id.trim() : (id.toString && id.toString());

    return typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);
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

/**
 * @param {string} mode The mode how we receive it from the osu API
 * @returns {string} The mode how it is saved in our database
 */
function formatModeForDatabase(mode) {
    // The osu API uses the term fruits, but we use catch internally
    if (mode === 'fruits') {
        return 'catch';
    } else {
        return mode;
    }
}

module.exports = {
    escapeUsername,
    escapeRegex,
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
    isValidMongoId,
    formatMode,
    formatModeForDatabase,
};
