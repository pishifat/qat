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

module.exports = { escapeUsername, getBeatmapsetIdFromUrl };
