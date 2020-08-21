import Vue from 'vue';
import pageFilters from './modules/pageFilters';

export default {
    namespaced: true,
    modules: {
        pageFilters,
    },
    state: () => ({
        evaluations: [],
        selectedEvaluationId: null,
        checkedEvaluations: [],
    }),
    mutations: {
        resetState (state) {
            state.evaluations = [];
            state.selectedEvaluationId = null;
            state.checkedEvaluations = [];
        },
        setEvaluations (state, evaluations) {
            state.evaluations = evaluations;
        },
        setSelectedEvaluationId (state, id) {
            state.selectedEvaluationId = id;
        },

        // modify data
        updateEvaluation (state, evaluation) {
            const i = state.evaluations.findIndex(a => a.id == evaluation.id);
            if (i !== -1) Vue.set(state.evaluations, i, evaluation);
        },
        updateCheckedEvaluations (state, payload) {
            if (state.checkedEvaluations.length == payload.length) {
                state.checkedEvaluations = [];
            } else {
                state.checkedEvaluations = payload;
            }
        },
    },
    getters: {
        filteredEvaluations: (state, getters, rootState) => {
            let evaluations = [...state.evaluations];
            const mode = rootState.evaluations.pageFilters.filters.mode;
            const value = rootState.evaluations.pageFilters.filters.value;

            if (mode) {
                evaluations = evaluations.filter(a => a.mode == mode);
            }

            if (value) {
                evaluations = evaluations.filter(a =>
                    a.user.username.toLowerCase().includes(value.toLowerCase())
                );
            }

            return evaluations;
        },
        individualEvaluations: (state, getters) => {
            return getters.filteredEvaluations.filter(a => !a.discussion);
        },
        discussionEvaluations: (state, getters) => {
            return getters.filteredEvaluations.filter(a => a.discussion);
        },
        selectedEvaluation: (state) => {
            return state.evaluations.find(e => e.id === state.selectedEvaluationId);
        },
        isApplication: (state, getters) => {
            if (!getters.selectedEvaluation) return false;

            return getters.selectedEvaluation.kind === 'application';
        },
        isCurrentBn: (state, getters) => {
            if (!getters.selectedEvaluation) return false;

            return getters.selectedEvaluation.kind === 'currentBn';
        },
        isResignation: (state, getters) => {
            if (!getters.selectedEvaluation) return false;

            return getters.selectedEvaluation.kind === 'resignation';
        },
    },
};
