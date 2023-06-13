const moment = require('moment');
const { default: Axios } = require('axios');
const Aiess = require('../models/aiess');

/**
 * Calculate mods count for each month
 * @param {string} username
 * @param {number} [months] number of months to look from
 * @returns {Promise<number[]>} array with values per month ex: [1,1,1]
 */
async function getUserModsCount(accessToken, username, months) {
    if (!username) return [];

    const baseUrl = `https://osu.ppy.sh/api/v2/beatmapsets/events?limit=50&types[]=kudosu_gain&types[]=kudosu_lost&user=${username}`;
    let maxDate = moment();
    let minDate = moment().subtract(1, 'month');
    let modCount = [];
    let allMods = new Map();
    if (!months) months = 3;

    // Loops for months
    for (let i = 0; i < months; i++) {
        const maxDateStr = maxDate.format('YYYY-MM-DD');
        const minDateStr = minDate.format('YYYY-MM-DD');
        const urlWithDate = baseUrl + `&min_date=${minDateStr}&max_date=${maxDateStr}`;
        let monthMods = new Map();
        let hasEvents = true;
        let pageNumber = 1;

        // Loops through pages of a month
        while (hasEvents) {
            const finalUrl = urlWithDate + `&page=${pageNumber}`;
            const headers = { 'Authorization': `Bearer ${accessToken}` };
            const response = await Axios.get(finalUrl, { headers });
            const events = response.data.events;

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
                            date: new Date(event.created_at),
                        });
                    }
                });

                // Filters repeated sets and checks for denied KDs
                pageMods.forEach(mod => {
                    if (
                        mod.isGain &&
                        !pageMods.some(m => m.discussionId == mod.discussionId && !m.isGain) &&
                        !monthMods.has(mod.beatmapsetId) &&
                        !allMods.has(mod.beatmapsetId)
                    ) {
                        // monthMods.push(mod);
                        monthMods.set(mod.beatmapsetId, mod);
                    }
                });

                // allMods.push(...monthMods.values());
                allMods = new Map([...allMods, ...monthMods]);
            }

            pageNumber++;
        }

        modCount.push(monthMods.size);
        minDate.subtract(1, 'month');
        maxDate.subtract(1, 'month');
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
async function getUserModScore(accessToken, username, months, mode) {
    if (!accessToken || !username) return undefined;

    const modsCount = await getUserModsCount(accessToken, username, months);
    let modScore = 0;
    let expectedMods = (mode && mode == 'osu' ? 4 : 3);

    for (let i = 0; i < modsCount.length; i++) {
        modScore += Math.log(1 + modsCount[i]) / Math.log(Math.sqrt(1 + expectedMods)) - (2 * (1 + expectedMods)) / (1 + modsCount[i]);
    }

    return Math.round(modScore * 100) / 100;
}

/**
 * @param {Date} initialDate
 * @param {Date} endDate
 * @param {object} user
 * @returns {Promise<number>} number of unique bubbled/qualified
 */
async function findUniqueNominationsCount(initialDate, endDate, user) {
    const events = await Aiess.distinct('beatmapsetId', {
        userId: user.osuId,
        type: {
            $in: ['nominate', 'qualify'],
        },
        timestamp: {
            $gt: initialDate,
            $lt: endDate
        },
    });

    return events.length;
}

/* find months of sufficient BN activity for members of NAT */
async function findAdditionalBnMonths (user) {
    const bnSiteLeftTheWomb = new Date('2019-05-01');
    let bnMonths = 0;

    if (user.natDuration) {
        const natHistory = user.history.filter(h => h.group == 'nat');

        let startDate;
        let nextDate;
        let endDate;

        for (let j = 0; j < natHistory.length; j++) {
            if (!(j % 2)) {
                const historyElement = natHistory[j];

                startDate = new Date(historyElement.date);
                nextDate = moment(startDate).add(1, 'months').toDate();
                endDate = natHistory[j + 1] ? natHistory[j + 1].date : new Date();

                while (nextDate < endDate) {
                    if (startDate < bnSiteLeftTheWomb) {
                        startDate = moment(bnSiteLeftTheWomb).toDate();
                        nextDate = moment(bnSiteLeftTheWomb).add(1, 'months').toDate();
                    }

                    const count = await findUniqueNominationsCount(startDate, nextDate, user);
                    startDate = moment(startDate).add(1, 'months').toDate();
                    nextDate = moment(nextDate).add(1, 'months').toDate();

                    const requirement = (historyElement.mode == 'mania' || historyElement.mode == 'catch') ? 2 : 3;

                    if (count >= requirement) bnMonths++;
                }
            }
        }
    }

    return bnMonths;
}

module.exports = {
    getUserModsCount,
    getUserModScore,
    findUniqueNominationsCount,
    findAdditionalBnMonths,
};
