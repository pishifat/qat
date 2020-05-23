import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import AppEvalPage from './pages/AppEvalPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        applications: [],
        evaluator: null,
        selectedIndividualApplicationId: null,
        selectedDiscussApplicationId: null,
        isNat: false,
        filters: {
            mode: '',
            value: '',
        },
    },
    mutations: {
        setApplications (state, applications) {
            state.applications = applications;
        },
        setEvaluator (state, evaluator) {
            state.evaluator = evaluator;
            state.isNat = evaluator.isNat;
        },
        setSelectedIndividualApplicationId (state, id) {
            state.selectedIndividualApplicationId = id;
        },
        setSelectedDiscussApplicationId (state, id) {
            state.selectedDiscussApplicationId = id;
        },

        // modify data
        updateApplication (state, application) {
            const i = state.applications.findIndex(a => a.id == application.id);
            if (i !== -1) Vue.set(state.applications, i, application);
        },

        // filters
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
        },
    },
    getters: {
        filteredApplications: (state) => {
            let applications = [...state.applications];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                applications = applications.filter(a => a.mode == mode);
            }

            if (state.filters.value.length) {
                applications = applications.filter(a => {
                    return a.applicant.username.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return applications;
        },
        individualApplications: (state, getters) => {
            return getters.filteredApplications.filter(a => !a.discussion);
        },
        discussApplications: (state, getters) => {
            return getters.filteredApplications.filter(a => a.discussion);
        },
        selectedIndividualApplication: (state) => {
            return state.applications.find(a => a.id === state.selectedIndividualApplicationId);
        },
        selectedDiscussApplication: (state) => {
            return state.applications.find(e => e.id === state.selectedDiscussApplicationId);
        },
        evaluatorId: (state) => {
            return state.evaluator.id;
        },
    },
    actions: {
        updateApplication ({ commit, state }, application) {
            commit('updateApplication', application);

            if (state.selectedIndividualApplicationId && state.selectedIndividualApplicationId === application.id) {
                commit('setSelectedIndividualApplicationId', application.id);
            } else if (state.selectedDiscussApplicationId && state.selectedDiscussApplicationId === application.id) {
                commit('setSelectedDiscussApplicationId', application.id);
            }
        },
        updateFilterMode ({ commit }, mode) {
            commit('setFilterMode', mode);
        },
        updateFilterValue ({ commit }, value) {
            commit('setFilterValue', value);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        AppEvalPage,
    },
});
