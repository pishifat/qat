import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import userActivityModule from './modules/userActivity';
import BnEvalPage from './pages/BnEvalPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
        userActivity: userActivityModule,
    },
    state: {
        evalRounds: [],
        evaluator: null,
        selectedIndividualRoundId: null,
        selectedDiscussRoundId: null,
        filters: {
            mode: '',
            value: '',
        },
    },
    mutations: {
        setEvalRounds (state, evalRounds) {
            state.evalRounds = evalRounds;
        },
        setEvaluator (state, evaluator) {
            state.evaluator = evaluator;
        },
        setSelectedIndividualRoundId (state, id) {
            state.selectedIndividualRoundId = id;
        },
        setSelectedDiscussRoundId (state, id) {
            state.selectedDiscussRoundId = id;
        },

        // modify data
        updateEvalRound (state, evalRound) {
            const i = state.evalRounds.findIndex(e => e.id == evalRound.id);
            if (i !== -1) Vue.set(state.evalRounds, i, evalRound);
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
        filteredEvalRounds: (state) => {
            let evalRounds = [...state.evalRounds];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                evalRounds = evalRounds.filter(e => e.mode == mode);
            }

            if (state.filters.value.length) {
                evalRounds = evalRounds.filter(e => {
                    return e.bn.username.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return evalRounds;
        },
        individualRounds: (state, getters) => {
            return getters.filteredEvalRounds.filter(e => !e.discussion);
        },
        discussRounds: (state, getters) => {
            return getters.filteredEvalRounds.filter(e => e.discussion);
        },
        selectedIndividualRound: (state) => {
            return state.evalRounds.find(e => e.id === state.selectedIndividualRoundId);
        },
        selectedDiscussRound: (state) => {
            return state.evalRounds.find(e => e.id === state.selectedDiscussRoundId);
        },
        evaluatorId: (state) => {
            return state.evaluator.id;
        },
    },
    actions: {
        updateEvalRound ({ commit, state }, evalRound) {
            commit('updateEvalRound', evalRound);

            if (state.selectedIndividualRoundId && state.selectedIndividualRoundId === evalRound.id) {
                commit('setSelectedIndividualRoundId', evalRound.id);
            } else if (state.selectedDiscussRoundId && state.selectedDiscussRoundId === evalRound.id) {
                commit('setSelectedDiscussRoundId', evalRound.id);
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
        BnEvalPage,
    },
});
