export default {
    namespaced: true,
    state: {
        tests: [],
        selectedTestId: null,
    },
    mutations: {
        setTests (state, tests) {
            state.tests = tests;
        },
        setSelectedTestId (state, id) {
            state.selectedTestId = id;
        },
    },
    getters: {
        selectedTest: (state) => {
            return state.tests.find(t => t.id === state.selectedTestId);
        },
    },
};
