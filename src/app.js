import './sass/app.scss';
import './bootstrap';
import { md } from './bootstrap';
import moment from 'moment';
import http from './store/http';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import store from './store/main';
import App from './App.vue';
import routes from './routes';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleArrowRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { toStandardDate, toMonthDayYear, toStandardDetailedDate, toRelativeDate, toRelativeShortDate, shorten, formatMode } from './filters';

const router = createRouter({
    history: createWebHistory(),
    routes,
    linkActiveClass: 'active',
});

router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} · BN Management` : 'BN Management';

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

const app = createApp(App);
app.use(store);
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);

// Global properties (replaces Vue.prototype)
app.config.globalProperties.$md = md;
app.config.globalProperties.$moment = moment;
app.config.globalProperties.$http = http;

// Global filter functions (replaces Vue.filter)
app.config.globalProperties.toStandardDate = toStandardDate;
app.config.globalProperties.toMonthDayYear = toMonthDayYear;
app.config.globalProperties.toStandardDetailedDate = toStandardDetailedDate;
app.config.globalProperties.toRelativeDate = toRelativeDate;
app.config.globalProperties.toRelativeShortDate = toRelativeShortDate;
app.config.globalProperties.shorten = shorten;
app.config.globalProperties.formatMode = formatMode;

app.mount('#app');
