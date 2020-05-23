import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import DataCollectionPage from './pages/DataCollectionPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        events: [],
        selectedEventId: null,
        filters: {
            mode: '',
            value: '',
        },
    },
    mutations: {
        setEvents (state, events) {
            state.events = events;
        },
        setSelectedEventId (state, id) {
            state.selectedEventId = id;
        },

        // modify data
        updateEvent (state, event) {
            const i = state.events.findIndex(e => e.id == event.id);
            if (i >= 0) Vue.set(state.events[i], event.modifiedField, event.value);
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
        filteredEvents: (state) => {
            let events = [...state.events];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                events = events.filter(e => e.modes.includes(mode));
            }

            if (state.filters.value.length) {
                events = events.filter(e => {
                    return e.metadata.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return events;
        },
        disqualifications: (state, getters) => {
            return getters.filteredEvents.filter(e => e.eventType == 'Disqualified');
        },
        pops: (state, getters) => {
            return getters.filteredEvents.filter(e => e.eventType == 'Popped');
        },
        selectedEvent: (state) => {
            return state.events.find(e => e.id === state.selectedEventId);
        },
    },
    actions: {
        updateFilterMode ({ commit }, mode) {
            commit('setFilterMode', mode);
        },
        updateFilterValue ({ commit }, value) {
            commit('setFilterValue', value);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        DataCollectionPage,
    },
});
