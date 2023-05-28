import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import VueRouter from 'vue-router';
import store from './store/main';
import App from './App.vue';
import routes from './routes';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleArrowRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

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
            (r.meta.requiresNat && !store.state.loggedInUser.isNat) ||
            (r.meta.requiresNatOrTrialNat && !(store.state.loggedInUser.isNatOrTrialNat)) ||
            (r.meta.requiresBnOrNat && !store.state.loggedInUser.isBnOrNat)
        )
    ) {
        next({ name: 'home' });
    } else {
        next();
    }
});

library.add(faCircleArrowRight);
library.add(faCircleCheck);
library.add(faCircleXmark);
Vue.component('font-awesome-icon', FontAwesomeIcon);

new Vue({
    store,
    router,
    render: h => h(App),
}).$mount('#app');
