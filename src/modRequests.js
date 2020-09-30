import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import ModRequests from './pages/ModRequests.vue';

Vue.use(Vuex);

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

const store = new Vuex.Store({
    state: {
        user: null,
        ownRequests: [],
        requests: [],
        involvedRequests: [],
        selectedRequestId: null,
        filters: [
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
                'hasRankedMaps',
            ],
        },
        monthsLimit: 2,
    },
    mutations: {
        setOwnRequests (state, payload) {
            state.user = payload.user;
            state.ownRequests = payload.ownRequests;
        },
        setAllRequests (state, payload) {
            state.requests = payload.requests;
            state.involvedRequests = payload.involvedRequests;
        },
        updateSelectRequestId (state, id) {
            state.selectedRequestId = id;
        },
        updateFilters (state, filter) {
            const i = state.filters.findIndex(f => f === filter);
            if (i !== -1) state.filters.splice(i, 1);
            else state.filters.push(filter);
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
                    (state.filters.includes('hasRankedMaps') && r.user.rankedBeatmapsets > 0)
                ) {
                    return false;
                }

                return true;
            });
        },
        selectedRequest (state) {
            return state.requests.find(r => r.id == state.selectedRequestId) || state.involvedRequests.find(r => r.id == state.selectedRequestId);
        },
        userReview (state, getters) {
            if (getters.selectedRequest) {
                return getters.selectedRequest.modReviews.find(r => r.user.id == state.user.id);
            }

            return null;
        },
    },
    actions: {
        async getData ({ commit, state }) {
            const { data } = await Axios.get(`/modRequests/owned`);

            if (!data.error) {
                commit('setOwnRequests', data);

                if (state.user && state.user.isFeatureTester) {
                    const { data } = await Axios.get(`/modRequests/all?limit=${state.monthsLimit}`);
                    if (!data.error) commit('setAllRequests', data);
                }
            }
        },
    },
});

new Vue({
    render: h => h(ModRequests),
    store,
}).$mount('#app');
