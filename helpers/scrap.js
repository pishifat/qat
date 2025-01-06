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
 * @param {Date} initialDate
 * @param {Date} endDate
 * @param {object} user
 * @returns {Promise<number>} number of unique bubbled/qualified
 */
async function findUniqueNominationsCount(initialDate, endDate, user, mode) {
    let query;

    if (mode) {
        query = {
            userId: user.osuId,
            type: {
                $in: ['nominate', 'qualify'],
            },
            timestamp: {
                $gt: initialDate,
                $lt: endDate
            },
            modes: mode, // this line is the only difference
        }
    } else {
        query = {
            userId: user.osuId,
            type: {
                $in: ['nominate', 'qualify'],
            },
            timestamp: {
                $gt: initialDate,
                $lt: endDate
            },
        }
    }
    
    const events = await Aiess.distinct('beatmapsetId', query);

    return events.length;
}

/* find months of sufficient BN activity for members of NAT */
async function findAdditionalBnMonths (user) {
    const bnSiteLeftTheWomb = new Date('2019-05-01');
    const activityRequirementChange = new Date('2024-11-03');

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

                    const count = await findUniqueNominationsCount(startDate, nextDate, user, historyElement.mode);
                    startDate = moment(startDate).add(1, 'months').toDate();
                    nextDate = moment(nextDate).add(1, 'months').toDate();

                    const oldActivityRequirement = (historyElement.mode == 'mania' || historyElement.mode == 'catch') ? 2 : 3;
                    const newActivityRequirement = 2;

                    const bnActivityRequirement = startDate < activityRequirementChange ? oldActivityRequirement : newActivityRequirement;

                    if (count >= bnActivityRequirement) bnMonths++;
                }
            }
        }
    }

    return bnMonths;
}

/**
 * @param {Array} reviews
 * @param {Array} evaluators
 * @param {Boolean} discussion
 * @returns {string} text for webhook
 */
function findEvaluatorStatuses(reviews, evaluators, discussion) {
    let text = '';

    if (!discussion) {
        const evaluatorIds = reviews.map(r => r.evaluator.id);

        for (const user of evaluators) {
            if (evaluatorIds.includes(user.id)) {
                text += `\n✅ `;
            } else {
                text += `\n❌ `;
            }

            text += `[${user.username}](https://osu.ppy.sh/users/${user.osuId})`;
        }
    }

    return text;
}

/**
 * @param {Boolean} discussion
 * @param {string} consensus
 * @param {string} feedback
 * @returns {string} text for webhook
 */
function findMissingContent(discussion, consensus) {
    let text = '\n**Next step:** ';

    if (!discussion) {
        text += `get more evaluations`;
    } else if (!consensus) {
        text += `decide consensus`;
    } else {
        text += `send PM`;
    }

    return text;
}

module.exports = {
    getUserModsCount,
    findUniqueNominationsCount,
    findAdditionalBnMonths,
    findEvaluatorStatuses,
    findMissingContent,
};
