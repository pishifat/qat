import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import main from './store/main';
import App from './App.vue';
import routes from './routes';
import Axios from 'axios';

Vue.use(Vuex);
Vue.use(VueRouter);

const store = new Vuex.Store(main);

const router = new VueRouter({
    mode: 'history',
    routes,
    linkActiveClass: 'active',
});

router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title || 'NAT/BN Management';

    if (!store.state.initialized) {
        const { data } = await Axios.get('/me');

        if (!data.error) {
            store.commit('setInitialData', data);
        }
    }

    if (
        to.matched.some(r =>
            (
                (
                    r.path.startsWith('/bneval') ||
                    r.path.startsWith('/datacollection') ||
                    r.path.startsWith('/evalarchive') ||
                    r.path.startsWith('/managereports') ||
                    r.path.startsWith('/managetest') ||
                    r.path.startsWith('/logs')
                ) &&
                !store.state.loggedInUser.hasFullReadAccess
            ) ||
            (
                (
                    r.path.startsWith('/discussionvote') ||
                    r.path.startsWith('/appeval') ||
                    r.path.startsWith('/modrequests/listing')
                ) &&
                !store.state.loggedInUser.hasBasicAccess
            )
        )
    ) {
        next({ path: '/' });
    } else {
        next();
    }
});

new Vue({
    store,
    router,
    render: h => h(App),
}).$mount('#app');
