const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Returns array with values per month ex: [1,1,1] or the calculated score ex: 7,77
 * @param {string} username
 * @param {string} mode To calculate and return the score, pass this argument
 * @returns {number|number[]|object}
 */
async function getUserModsCount(username, mode, months) {
    let baseUrl = `https://osu.ppy.sh/beatmapsets/events?limit=50&types[]=kudosu_gain&types[]=kudosu_lost&user=${username}`;
    let maxDate = new Date();
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    let modCount = [];
    let modScore = 0;
    if (!months) months = 3;
    let expectedMods = (mode && mode == 'osu' ? 4 : 3);

    // Loops for months
    for (let i = 0; i < months; i++) {
        const maxDateStr = `${maxDate.getFullYear()}-${maxDate.getMonth() + 1}-${maxDate.getDate()}`;
        const minDateStr = `${minDate.getFullYear()}-${minDate.getMonth() + 1}-${minDate.getDate()}`;
        let urlWithDate = baseUrl + `&min_date=${minDateStr}&max_date=${maxDateStr}`;
        let monthMods = [];
        let hasEvents = true;
        let pageNumber = 1;

        // Loops through pages of a month
        while (hasEvents) {
            let finalUrl = urlWithDate + `&page=${pageNumber}`;

            try {
                const historyHtml = await axios.get(finalUrl);
                const $ = cheerio.load(historyHtml.data);
                const events = JSON.parse($('#json-events').html());

                if (!events.length) {
                    hasEvents = false;
                } else {
                    let pageMods = [];
                    events.forEach(event => {
                        if (event.beatmapset && event.discussion) {
                            let mod = {
                                beatmapsetId: event.beatmapset.id,
                                discussionId: event.discussion.id,
                                isGain: event.type == 'kudosu_gain',
                            };

                            pageMods.push(mod);
                        }
                    });

                    // Filters repeated sets and checks for denied KDs
                    pageMods.forEach(mod => {
                        if (mod.isGain &&
                            pageMods.findIndex(m => m.discussionId == mod.discussionId && !m.isGain) === -1 &&
                            monthMods.findIndex(m => m.beatmapsetId == mod.beatmapsetId) === -1) {
                            monthMods.push(mod);
                        }
                    });
                }
            } catch (error) {
                return { error: `Couldn't calculate your score` };
            }

            pageNumber ++;
        }

        modScore += Math.log(1 + monthMods.length) / Math.log(Math.sqrt(1 + expectedMods)) - (2 * (1 + expectedMods)) / (1 + monthMods.length);
        modCount.push(monthMods.length);
        minDate.setDate(minDate.getDate() - 30);
        maxDate.setDate(maxDate.getDate() - 30);
    }

    if (mode) {
        return modScore.toFixed(2);
    } else {
        return modCount;
    }
}

module.exports = {
    getUserModsCount,
};
