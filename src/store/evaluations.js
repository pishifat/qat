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
        previewFeedback: false,
        previewModdingComment: false,
        previewBehaviorComment: false,
    }),
    mutations: {
        resetState (state) {
            state.evaluations = [];
            state.selectedEvaluationId = null;
            state.checkedEvaluations = [];
            state.previewFeedback = false;
            state.previewModdingComment = false;
            state.previewBehaviorComment = false;
        },
        setEvaluations (state, evaluations) {
            state.evaluations = evaluations;
        },
        setSelectedEvaluationId (state, id) {
            state.selectedEvaluationId = id;
        },
        togglePreviewFeedback (state) {
            state.previewFeedback = !state.previewFeedback;
        },
        togglePreviewModdingComment (state) {
            state.previewModdingComment = !state.previewModdingComment;
        },
        togglePreviewBehaviorComment (state) {
            state.previewBehaviorComment = !state.previewBehaviorComment;
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
            const group = rootState.evaluations.pageFilters.filters.group;
            const value = rootState.evaluations.pageFilters.filters.value;

            if (mode) {
                evaluations = evaluations.filter(a => a.mode == mode);
            }

            if (group) {
                evaluations = evaluations.filter(a =>
                    a.user.groups.includes(group)
                );
            }

            if (value) {
                evaluations = evaluations.filter(a =>
                    a.user.username.toLowerCase().includes(value.toLowerCase())
                );
            }

            return evaluations;
        },
        individualEvaluations: (state, getters) => {
            return getters.filteredEvaluations.filter(e => !e.discussion);
        },
        discussionEvaluations: (state, getters) => {
            return getters.filteredEvaluations.filter(e => e.discussion);
        },
        archivedApplications: (state, getters) => {
            return getters.filteredEvaluations.filter(e => e.isApplication);
        },
        archivedCurrentBnEvals: (state, getters) => {
            return getters.filteredEvaluations.filter(e => !e.isApplication);
        },
        selectedEvaluation: (state) => {
            return state.evaluations.find(e => e.id === state.selectedEvaluationId);
        },
    },
};
