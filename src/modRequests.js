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
        filters: [],
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

                if (
                    (state.filters.includes('osu') && r.beatmapset.modes.includes('osu')) ||
                    (state.filters.includes('taiko') && r.beatmapset.modes.includes('taiko')) ||
                    (state.filters.includes('hasRankedMaps') && r.user.rankedBeatmapsets > 0) ||
                    (state.filters.includes('long') && r.beatmapset.totalLengthString === 'long') ||
                    (state.filters.includes('short') && r.beatmapset.totalLengthString === 'short') ||
                    (state.filters.includes('simple') && r.category === 'simple') ||
                    (state.filters.includes('tech') && r.category === 'tech') ||
                    (state.filters.includes('doubleBpm') && r.category === 'doubleBpm') ||
                    (state.filters.includes('conceptual') && r.category === 'conceptual')
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
            console.log(data);

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
