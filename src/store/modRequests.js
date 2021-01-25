/**
 * Check if there's any mode remaning after applying the modes filters
 * @param {array} filters
 * @param {array} beatmapModes
 * @returns {boolean}
 */
function checkModes(filters, beatmapModes) {
    const filteredModes = beatmapModes.filter(m => filters.includes(m));

    return filteredModes.length === beatmapModes.length;
}

/**
 * Check if should filter out by genre or language
 * @param {array} filters
 * @param {array} values
 * @param {string} beatmapValue
 * @returns {boolean}
 */
function checkSetting(filters, values, beatmapValue) {
    const genre = values.find(g => g === beatmapValue) || 'unspecified';

    return filters.some(f => f.includes(genre));
}

const filters = localStorage.requestsFilters && JSON.parse(localStorage.requestsFilters);

export default {
    namespaced: true,
    state: {
        ownRequests: [],
        requests: [],
        involvedRequests: [],
        selectedRequestId: null,
        editingRequestId: null,
        filters: filters || [
            'ranked',
            'qualified',
        ],
        possibleFilters: {
            Mode: [
                'osu',
                'taiko',
                'fruits',
                'mania',
            ],
            Length: [
                'long',
                'short',
            ],
            Category: [
                'simple',
                'tech',
                'doubleBpm',
                'conceptual',
            ],
            BPM: [
                'slow',
                'average',
                'fast',
            ],
            Status: [
                'ranked',
                'qualified',
                'bubbled',
            ],
            Reviews: [
                'not reviewed',
                'denied',
                'accepted',
            ],
            Others: [
                'has ranked maps',
                'doesnt have ranked maps',
            ],
            Genre: [
                'video game',
                'anime',
                'rock',
                'pop',
                'novelty',
                'hip hop',
                'electronic',
                'folk',
                'unspecified genre',
            ],
            Language: [
                'english',
                'japanese',
                'instrumental',
                'unspecified language',
            ],
        },
        monthsLimit: 1,
    },

    mutations: {
        setOwnRequests (state, payload) {
            state.ownRequests = payload.ownRequests;
        },
        setAllRequests (state, payload) {
            state.requests = payload.requests;
        },
        setInvolvedRequests (state, payload) {
            state.involvedRequests = payload.involvedRequests;
        },
        updateSelectRequestId (state, id) {
            state.selectedRequestId = id;
        },
        updateEditingRequestId (state, id) {
            state.editingRequestId = id;
        },
        updateFilters (state, filter) {
            const i = state.filters.findIndex(f => f === filter);
            if (i !== -1) state.filters.splice(i, 1);
            else state.filters.push(filter);

            localStorage.requestsFilters = JSON.stringify(state.filters);
        },
        increaseLimit (state) {
            state.monthsLimit++;
        },
    },

    getters: {
        filteredRequests (state) {
            return state.requests.filter(r => {
                const lastEvent = r.beatmapset.events.length && r.beatmapset.events[0];

                if (
                    checkModes(state.filters, r.beatmapset.modes) ||
                    (state.filters.includes('long') && r.beatmapset.totalLengthString === 'long') ||
                    (state.filters.includes('short') && r.beatmapset.totalLengthString === 'short') ||
                    (state.filters.includes('simple') && r.category === 'simple') ||
                    (state.filters.includes('tech') && r.category === 'tech') ||
                    (state.filters.includes('doubleBpm') && r.category === 'doubleBpm') ||
                    (state.filters.includes('conceptual') && r.category === 'conceptual') ||
                    (state.filters.includes('slow') && r.beatmapset.bpm < 160) ||
                    (state.filters.includes('average') && r.beatmapset.bpm >= 160 && r.beatmapset.bpm < 190) ||
                    (state.filters.includes('fast') && r.beatmapset.bpm >= 190) ||
                    (
                        lastEvent &&
                        (
                            (state.filters.includes('ranked') && lastEvent.type === 'rank') ||
                            (state.filters.includes('qualified') && lastEvent.type === 'qualify') ||
                            (state.filters.includes('bubbled') && lastEvent.type === 'nominate')
                        )
                    ) ||
                    (state.filters.includes('not reviewed') && r.modReviews.length === 0) ||
                    (state.filters.includes('denied') && r.modReviews.some(r => r.action === 'denied')) ||
                    (state.filters.includes('accepted') && r.modReviews.some(r => r.action === 'accepted')) ||
                    (state.filters.includes('has ranked maps') && r.user.rankedBeatmapsets > 0) ||
                    (state.filters.includes('doesnt have ranked maps') && r.user.rankedBeatmapsets == 0) ||
                    checkSetting(state.filters, state.possibleFilters.Genre, r.beatmapset.genre) ||
                    checkSetting(state.filters, state.possibleFilters.Language, r.beatmapset.language)
                ) {
                    return false;
                }

                return true;
            });
        },
        selectedEditRequest (state) {
            return state.ownRequests.find(r => r.id == state.editingRequestId);
        },
        selectedRequest (state) {
            return state.requests.find(r => r.id == state.selectedRequestId) || state.involvedRequests.find(r => r.id == state.selectedRequestId);
        },
        userReview (state, getters, rootState) {
            if (getters.selectedRequest) {
                return getters.selectedRequest.modReviews.find(r => r.user.id == rootState.loggedInUser.id);
            }

            return null;
        },
    },
};
