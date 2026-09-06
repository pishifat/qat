const Aiess = require('../models/aiess');

const PRE_RESET_TYPES = {
    $and: [
        { type: { $ne: 'rank' } },
        { type: { $ne: 'disqualify' } },
        { type: { $ne: 'nomination_reset' } },
        { type: { $exists: true } },
    ],
};

/**
 * Keep a DQ or pop only if this user was a nominator of the map immediately before the reset.
 * Matches UserActivity lists (nominationsDisqualified / nominationsPopped).
 *
 * @param {number} userOsuId
 * @param {Array} uniqueNominations
 * @param {Array} events
 * @param {{ isPop: boolean }} options
 * @returns {Promise<Array>}
 */
async function filterAttributedResets(userOsuId, uniqueNominations, events, { isPop }) {
    const attributed = [];

    for (const event of events) {
        if (!uniqueNominations.some(n => n.beatmapsetId == event.beatmapsetId && n.timestamp < event.timestamp)) {
            continue;
        }

        const prior = await Aiess
            .find({
                beatmapsetId: event.beatmapsetId,
                timestamp: { $lt: event.timestamp },
                ...PRE_RESET_TYPES,
            })
            .sort({ timestamp: -1 })
            .limit(isPop || event.type == 'nomination_reset' ? 1 : 2);

        if (isPop) {
            if (prior[0] && prior[0].userId == userOsuId) {
                attributed.push(event);
            }
        } else if ((prior[0] && prior[0].userId == userOsuId) || (prior[1] && prior[1].userId == userOsuId)) {
            attributed.push(event);
        }
    }

    return attributed;
}

/**
 * DQs and pops of maps this user nominated in the window (not DQs they issued).
 *
 * @param {number} userOsuId
 * @param {string[]} modes
 * @param {Date} minDate
 * @param {Date} maxDate
 * @returns {Promise<{ uniqueNominations: Array, nominationsDisqualified: Array, nominationsPopped: Array }>}
 */
async function getAttributedNominationResets(userOsuId, modes, minDate, maxDate) {
    const uniqueNominations = await Aiess.getUniqueUserEvents(
        userOsuId,
        minDate,
        maxDate,
        modes,
        ['nominate', 'qualify']
    );

    const beatmapsetIds = uniqueNominations.map(n => n.beatmapsetId);

    if (!beatmapsetIds.length) {
        return {
            uniqueNominations,
            nominationsDisqualified: [],
            nominationsPopped: [],
        };
    }

    const [allNominationsDisqualified, allNominationsPopped] = await Promise.all([
        Aiess.getRelatedBeatmapsetEvents(userOsuId, beatmapsetIds, minDate, maxDate, modes, 'disqualify'),
        Aiess.getRelatedBeatmapsetEvents(userOsuId, beatmapsetIds, minDate, maxDate, modes, 'nomination_reset'),
    ]);

    const [nominationsDisqualified, nominationsPopped] = await Promise.all([
        filterAttributedResets(userOsuId, uniqueNominations, allNominationsDisqualified, { isPop: false }),
        filterAttributedResets(userOsuId, uniqueNominations, allNominationsPopped, { isPop: true }),
    ]);

    return {
        uniqueNominations,
        nominationsDisqualified,
        nominationsPopped,
    };
}

module.exports = {
    filterAttributedResets,
    getAttributedNominationResets,
};
