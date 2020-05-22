import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import TestSubmissionPage from './pages/TestSubmissionPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        TestSubmissionPage,
    },
});
