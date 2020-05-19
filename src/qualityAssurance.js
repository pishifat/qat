import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import QualityAssurancePage from './pages/QualityAssurancePage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        events: [],
        overwriteEvents: [],
        userId: null,
        userOsuId: null,
        username: null,
        isNat: false,
        filters: {
            mode: '',
            value: '',
        },
    },
    mutations: {
        setEvents (state, events) {
            state.events = events;
        },
        setOverwriteEvents (state, events) {
            state.overwriteEvents = events;
        },
        setUserId (state, id) {
            state.userId = id;
        },
        setUserOsuId (state, id) {
            state.userOsuId = id;
        },
        setUsername (state, username) {
            state.username = username;
        },
        setIsNat (state, value) {
            state.isNat = value;
        },

        // modify data
        updateEvent (state, event) {
            const i = state.events.findIndex(e => e.id == event.id);
            if (i !== -1) Vue.set(state.events, i, event);
        },
        addEvents (state, events) {
            state.events = state.events.concat(events);
        },

        // filters
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
        },
    },
    getters: {
        allEvents: (state) => {
            return state.events;
        },

        // page vetoes
        filteredEvents: (state) => {
            let events = [...state.events];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                events = events.filter(e => e.modes.includes(mode));
            }

            if (state.filters.value.length) {
                events = events.filter(e => {
                    return e.metadata.toLowerCase().includes(state.filters.value.toLowerCase()) ||
                    e.hostName.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return events;
        },
    },
    actions: {
        updateVeto ({ commit, state }, veto) {
            commit('updateVeto', veto);

            if (state.selectedVeto && state.selectedVeto.id === veto.id) {
                commit('setSelectedVetoId', veto.id);
            }
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        QualityAssurancePage,
    },
});
