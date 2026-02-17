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
                $lt: endDate,
            },
            modes: mode, // this line is the only difference
        };
    } else {
        query = {
            userId: user.osuId,
            type: {
                $in: ['nominate', 'qualify'],
            },
            timestamp: {
                $gt: initialDate,
                $lt: endDate,
            },
        };
    }

    const events = await Aiess.distinct('beatmapsetId', query);

    return events.length;
}

/**
 * find months of sufficient BN activity for members of NAT
 *
 * activity is counted based on calendar months (not rolling 30-day periods)
 * partial months (first and last) are included
 */
async function findAdditionalBnMonths (user) {
    const bnSiteLeftTheWomb = new Date('2019-05-01');
    const activityRequirementChange = new Date('2024-11-03');

    let bnMonths = 0;

    if (user.natDuration) {
        const natHistory = user.history.filter(h => h.group == 'nat');

        for (let j = 0; j < natHistory.length; j++) {
            if (!(j % 2)) {
                const historyElement = natHistory[j];

                // Get the actual join date and end date for this NAT period
                let actualJoinDate = new Date(historyElement.date);
                let endDate = natHistory[j + 1] ? natHistory[j + 1].date : new Date();

                // Adjust join date if before bnSiteLeftTheWomb
                if (actualJoinDate < bnSiteLeftTheWomb) {
                    actualJoinDate = bnSiteLeftTheWomb;
                }

                // Start from the beginning of the calendar month containing the join date
                let currentMonthStart = moment(actualJoinDate).startOf('month');
                let currentMonthEnd = moment(currentMonthStart).endOf('month');

                // Process each calendar month until we reach the end date
                while (currentMonthStart.toDate() < endDate) {
                    // For the first month, use actual join date; for others, use start of month
                    const monthStart = currentMonthStart.isSame(moment(actualJoinDate).startOf('month'), 'month')
                        ? actualJoinDate
                        : currentMonthStart.toDate();

                    // For the last month, use end date; for others, use end of month
                    const monthEnd = currentMonthEnd.toDate() > endDate
                        ? endDate
                        : currentMonthEnd.toDate();

                    const count = await findUniqueNominationsCount(monthStart, monthEnd, user, historyElement.mode);

                    // Determine activity requirement based on the start of the month being checked
                    const oldActivityRequirement = (historyElement.mode == 'mania' || historyElement.mode == 'catch') ? 2 : 3;
                    const newActivityRequirement = 2;
                    const bnActivityRequirement = monthStart < activityRequirementChange ? oldActivityRequirement : newActivityRequirement;

                    if (count >= bnActivityRequirement) bnMonths++;

                    // Move to next calendar month
                    currentMonthStart = moment(currentMonthStart).add(1, 'month').startOf('month');
                    currentMonthEnd = moment(currentMonthStart).endOf('month');
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

/**
 * Check if a user's tenure history overlaps with a date range
 * @param {Array} history - Array of history entries for a specific group (bn or nat)
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @returns {boolean} - True if the user was in the group during any part of the date range
 */
function checkTenureOverlap(history, startDate, endDate) {
    if (!history || history.length === 0) return false;

    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Track active periods using the same logic as getDuration
    let isActive = 0;
    const relevantHistory = [];

    for (let i = 0; i < sortedHistory.length; i++) {
        const entry = sortedHistory[i];
        entry.kind === 'joined' ? isActive++ : isActive--;

        // Only track transitions from inactive->active or active->inactive
        if ((entry.kind === 'joined' && isActive === 1) || (entry.kind === 'left' && isActive === 0)) {
            relevantHistory.push(entry);
        }
    }

    // Pair up joined and left events
    const joinedEvents = relevantHistory.filter(h => h.kind === 'joined');
    const leftEvents = relevantHistory.filter(h => h.kind === 'left');

    // Check each tenure period for overlap
    for (const joinedEvent of joinedEvents) {
        const periodStart = new Date(joinedEvent.date);

        // Find the corresponding left event (if any)
        const leftIndex = leftEvents.findIndex(d => new Date(d.date) > periodStart);
        const leftEvent = leftIndex !== -1 ? leftEvents[leftIndex] : null;

        const periodEnd = leftEvent ? new Date(leftEvent.date) : new Date(); // Use current date if still active

        // Check if this period overlaps with the query date range
        if (periodStart <= endDate && periodEnd >= startDate) {
            return true;
        }
    }

    return false;
}

/**
 * Get game modes from history entries that overlap with a date range
 * @param {Array} history - Array of history entries for a specific group (bn or nat)
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @returns {Array<string>} - Array of unique game modes from history entries within the date range
 */
function getModesFromHistory(history, startDate, endDate) {
    if (!history || history.length === 0) return [];

    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const modes = new Set();

    // Track active periods using the same logic as getDuration
    let isActive = 0;
    const relevantHistory = [];

    for (let i = 0; i < sortedHistory.length; i++) {
        const entry = sortedHistory[i];
        entry.kind === 'joined' ? isActive++ : isActive--;

        // Only track transitions from inactive->active or active->inactive
        if ((entry.kind === 'joined' && isActive === 1) || (entry.kind === 'left' && isActive === 0)) {
            relevantHistory.push(entry);
        }
    }

    // Pair up joined and left events
    const joinedEvents = relevantHistory.filter(h => h.kind === 'joined');
    const leftEvents = relevantHistory.filter(h => h.kind === 'left');

    // Check each tenure period for overlap and collect modes
    for (const joinedEvent of joinedEvents) {
        const periodStart = new Date(joinedEvent.date);

        // Find the corresponding left event (if any)
        const leftIndex = leftEvents.findIndex(d => new Date(d.date) > periodStart);
        const leftEvent = leftIndex !== -1 ? leftEvents[leftIndex] : null;

        const periodEnd = leftEvent ? new Date(leftEvent.date) : new Date(); // Use current date if still active

        // Check if this period overlaps with the query date range
        if (periodStart <= endDate && periodEnd >= startDate) {
            // Add the mode from this history entry
            if (joinedEvent.mode) {
                modes.add(joinedEvent.mode);
            }
        }
    }

    return Array.from(modes);
}

module.exports = {
    getUserModsCount,
    findUniqueNominationsCount,
    findAdditionalBnMonths,
    findEvaluatorStatuses,
    findMissingContent,
    checkTenureOverlap,
    getModesFromHistory,
};
