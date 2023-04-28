import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import toastsModule from './modules/toasts';
import userActivity from './modules/userActivity';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
        activity: userActivity,
    },
    state: {
        initialized: false,
        isLoading: false,
        loggedInUser: null,
        allUsersByMode: [],
        allOpenUsersByMode: [],
    },
    getters: {
        userMainMode (state) {
            if (state.loggedInUser && state.loggedInUser.modes && state.loggedInUser.modes.length) {
                return state.loggedInUser.modes[0];
            }

            return 'osu';
        },
    },
    mutations: {
        setInitialData (state, payload) {
            if (!payload.error) {
                state.loggedInUser = payload.me;
            }

            state.initialized = true;
        },
        setHomeData (state, allUsersByMode) {
            state.allUsersByMode = allUsersByMode;
        },
        setOpenUsersData (state, allOpenUsersByMode) {
            state.allOpenUsersByMode = allOpenUsersByMode;
        },
        updateLoadingState (state) {
            state.isLoading = !state.isLoading;
        },
    },
    actions: {
        async setInitialData ({ commit }) {
            const { data } = await Axios.get('/me');
            commit('setInitialData', data);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

export default store;
