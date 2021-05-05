import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import VueRouter from 'vue-router';
import store from './store/main';
import App from './App.vue';
import routes from './routes';

Vue.use(VueRouter);

const router = new VueRouter({
    mode: 'history',
    routes,
    linkActiveClass: 'active',
});

router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title || 'NAT/BN Management';

    if (!store.state.initialized) {
        await store.dispatch('setInitialData');
    }

    if (
        store.state.loggedInUser &&
        to.matched.some(r =>
            (r.meta.requiresBasicAccess && !store.state.loggedInUser.hasBasicAccess) ||
            (r.meta.requiresFullReadAccess && !store.state.loggedInUser.hasFullReadAccess) ||
            (r.meta.requiresFullReadAccessOrTrialNat && !(store.state.loggedInUser.hasFullReadAccess || store.state.loggedInUser.isTrialNat))
        )
    ) {
        next({ name: 'home' });
    } else {
        next();
    }
});

new Vue({
    store,
    router,
    render: h => h(App),
}).$mount('#app');
