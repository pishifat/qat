import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import userActivityModule from './modules/userActivity';
import EvalArchivePage from './pages/EvalArchivePage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
        userActivity: userActivityModule,
    },
    state: {
        applications: [],
        evalRounds: [],
        selectedDiscussApplicationId: null,
        selectedDiscussRoundId: null,
        isQueried: false,
        evaluator: null,
        isNat: true,
    },
    mutations: {
        setIsQueried (state, value) {
            state.isQueried = value;
        },
        setEvaluator (state, evaluator) {
            state.evaluator = evaluator;
        },
        setApplications (state, applications) {
            state.applications = applications;
        },
        setEvalRounds (state, evalRounds) {
            state.evalRounds = evalRounds;
        },
        setSelectedDiscussApplicationId (state, id) {
            state.selectedDiscussApplicationId = id;
        },
        setSelectedDiscussRoundId (state, id) {
            state.selectedDiscussRoundId = id;
        },
    },
    getters: {
        selectedDiscussApplication: (state) => {
            return state.applications.find(a => a.id === state.selectedDiscussApplicationId);
        },
        selectedDiscussRound: (state) => {
            return state.evalRounds.find(a => a.id === state.selectedDiscussRoundId);
        },
        evaluatorId: (state) => {
            return state.evaluator.id;
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        EvalArchivePage,
    },
});
