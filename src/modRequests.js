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
    },
    getters: {
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
