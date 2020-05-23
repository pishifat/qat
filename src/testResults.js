import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import TestResultsPage from './pages/TestResultsPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        tests: [],
        isNat: false,
        selectedTestId: null,
    },
    mutations: {
        setTests (state, tests) {
            state.tests = tests;
        },
        setIsNat (state, value) {
            state.isNat = value;
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
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        TestResultsPage,
    },
});
