const cheerio = require('cheerio');
const moment = require('moment');
const { default: Axios } = require('axios');

/**
 * Calculate mods count for each month
 * @param {string} username
 * @param {number} [months] number of months to look from
 * @returns {Promise<number[]>} array with values per month ex: [1,1,1]
 */
async function getUserModsCount(username, months) {
    if (!username) return [];

    const baseUrl = `https://osu.ppy.sh/beatmapsets/events?limit=50&types[]=kudosu_gain&types[]=kudosu_lost&user=${username}`;
    let maxDate = moment();
    let minDate = moment().subtract(30, 'days');
    let modCount = [];
    let allMods = [];
    if (!months) months = 3;

    // Loops for months
    for (let i = 0; i < months; i++) {
        const maxDateStr = maxDate.format('YYYY-MM-DD');
        const minDateStr = minDate.format('YYYY-MM-DD');
        const urlWithDate = baseUrl + `&min_date=${minDateStr}&max_date=${maxDateStr}`;
        let monthMods = [];
        let hasEvents = true;
        let pageNumber = 1;

        // Loops through pages of a month
        while (hasEvents) {
            const finalUrl = urlWithDate + `&page=${pageNumber}`;
            const historyHtml = await Axios.get(finalUrl);
            const $ = cheerio.load(historyHtml.data);
            const events = JSON.parse($('#json-events').html());

            if (!events.length) {
                hasEvents = false;
            } else {
                let pageMods = [];
                events.forEach(event => {
                    if (event.beatmapset && event.discussion) {
                        pageMods.push({
                            beatmapsetId: event.beatmapset.id,
                            discussionId: event.discussion.id,
                            isGain: event.type == 'kudosu_gain',
                        });
                    }
                });

                // Filters repeated sets and checks for denied KDs
                pageMods.forEach(mod => {
                    if (
                        mod.isGain &&
                        !pageMods.some(m => m.discussionId == mod.discussionId && !m.isGain) &&
                        !monthMods.some(m => m.beatmapsetId == mod.beatmapsetId) &&
                        !allMods.some(m => m.beatmapsetId == mod.beatmapsetId)
                    ) {
                        monthMods.push(mod);
                    }
                });

                allMods.push(...monthMods);
            }

            pageNumber ++;
        }

        modCount.push(monthMods.length);
        minDate.subtract(30, 'days');
        maxDate.subtract(30, 'days');
    }

    return modCount;
}

/**
 * Calculate mods score of an user
 * @param {string} username
 * @param {number} months number of months to look from
 * @param {string} mode
 * @returns {Promise<number|undefined>} mod score fixed to two decimals ex: 7,77
 */
async function getUserModScore(username, months, mode) {
    if (!username) return undefined;

    const modsCount = await getUserModsCount(username, months);
    let modScore = 0;
    let expectedMods = (mode && mode == 'osu' ? 4 : 3);

    for (let i = 0; i < modsCount.length; i++) {
        modScore += Math.log(1 + modsCount[i]) / Math.log(Math.sqrt(1 + expectedMods)) - (2 * (1 + expectedMods)) / (1 + modsCount[i]);
    }

    return Math.round(modScore * 100) / 100;
}

module.exports = {
    getUserModsCount,
    getUserModScore,
};
