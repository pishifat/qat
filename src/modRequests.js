import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import ModRequests from './pages/ModRequests.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        user: null,
        ownRequests: [],
        requests: [],
        selectedRequestId: null,
        filters: [
            'ranked',
            'qualified',
        ],
        possibleFilters: [
            'osu',
            'taiko',
            'fruits',
            'mania',
            'hasRankedMaps',
            'long',
            'short',
            'simple',
            'tech',
            'doubleBpm',
            'conceptual',
            'slow',
            'average',
            'fast',
            'ranked',
            'qualified',
            'bubbled',
        ],
    },
    mutations: {
        setInitialData (state, payload) {
            state.user = payload.user;
            state.requests = payload.requests;
            state.ownRequests = payload.ownRequests;
        },
        updateSelectRequestId (state, id) {
            state.selectedRequestId = id;
        },
        updateFilters (state, filter) {
            const i = state.filters.findIndex(f => f === filter);
            if (i !== -1) state.filters.splice(i, 1);
            else state.filters.push(filter);
        },
    },
    getters: {
        filteredRequests (state) {
            return state.requests.filter(r => {
                const lastEvent = r.beatmapset.events.length && r.beatmapset.events[0];

                if (
                    (state.filters.includes('osu') && r.beatmapset.modes.includes('osu')) ||
                    (state.filters.includes('taiko') && r.beatmapset.modes.includes('taiko')) ||
                    (state.filters.includes('mania') && r.beatmapset.modes.includes('mania')) ||
                    (state.filters.includes('fruits') && r.beatmapset.modes.includes('fruits')) ||
                    (state.filters.includes('hasRankedMaps') && r.user.rankedBeatmapsets > 0) ||
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
                            (state.filters.includes('ranked') && lastEvent.eventType === 'Ranked') ||
                            (state.filters.includes('qualified') && lastEvent.eventType === 'Qualified') ||
                            (state.filters.includes('bubbled') && lastEvent.eventType === 'Bubbled')
                        )
                    )
                ) {
                    return false;
                }

                return true;
            });
        },
        selectedRequest (state) {
            return state.requests.find(r => r.id == state.selectedRequestId);
        },
        userReview (state, getters) {
            if (getters.selectedRequest) {
                return getters.selectedRequest.modReviews.find(r => r.user.id == state.user.id);
            }

            return null;
        },
    },
    actions: {
        async getData ({ commit }) {
            const { data } = await Axios.get('/modRequests/relevantInfo');

            if (!data.error) {
                commit('setInitialData', data);
            }
        },
    },
});

new Vue({
    render: h => h(ModRequests),
    store,
}).$mount('#app');
