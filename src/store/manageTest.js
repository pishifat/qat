import Vue from 'vue';

export default {
    namespaced: true,
    state: {
        questions: [],
        selectedQuestionId: null,
    },
    mutations: {
        setQuestions (state, questions) {
            state.questions = questions;
        },
        setSelectedQuestionId (state, id) {
            state.selectedQuestionId = id;
        },

        // modify data
        updateQuestion (state, question) {
            const i = state.questions.findIndex(q => q.id === question.id);
            if (i !== -1) Vue.set(state.questions, i, question);
        },
        addQuestion (state, question) {
            state.questions.unshift(question);
        },
    },
    getters: {
        selectedQuestion: (state) => {
            return state.questions.find(q => q.id === state.selectedQuestionId);
        },
    },
};
