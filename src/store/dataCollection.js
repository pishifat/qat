import pageFilters from './modules/pageFilters';

export default {
    namespaced: true,
    modules: {
        pageFilters,
    },
    state: {
        events: [],
        selectedEventId: null,
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
            if (i >= 0) state.events[i][event.modifiedField] = event.value;
        },
    },
    getters: {
        filteredEvents: (state, getters, rootState) => {
            let events = [...state.events];
            const mode = rootState.dataCollection.pageFilters.filters.mode;
            const value = rootState.dataCollection.pageFilters.filters.value;

            if (mode) {
                events = events.filter(e => e.modes.includes(mode));
            }

            if (value) {
                events = events.filter(e => {
                    return e.artistTitle.toLowerCase().includes(value.toLowerCase());
                });
            }

            return events;
        },
        disqualifications: (state, getters) => {
            return getters.filteredEvents.filter(e => e.type == 'disqualify');
        },
        pops: (state, getters) => {
            return getters.filteredEvents.filter(e => e.type == 'nomination_reset');
        },
        selectedEvent: (state) => {
            return state.events.find(e => e.id === state.selectedEventId);
        },
    },
};
