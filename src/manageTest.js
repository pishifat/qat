import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import ManageTestPage from './pages/ManageTestPage.vue';

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
        ManageTestPage,
    },
});
