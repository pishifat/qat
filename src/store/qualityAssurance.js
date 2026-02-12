import pageFilters from './modules/pageFilters';

export default {
    namespaced: true,
    modules: {
        pageFilters,
    },
    state: {
        events: [],
        overwriteEvents: [],
    },
    mutations: {
        setEvents (state, events) {
            state.events = events;
        },
        setOverwriteEvents (state, events) {
            state.overwriteEvents = events;
        },

        // modify data
        updateEvent (state, event) {
            const i = state.events.findIndex(e => e.id == event.id);
            if (i !== -1) state.events[i] = event;
        },
        addEvents (state, events) {
            state.events = state.events.concat(events);
        },
    },
    getters: {
        allEvents: (state) => {
            return state.events;
        },

        // page vetoes
        filteredEvents: (state, getters, rootState) => {
            let events = [...state.events];
            const mode = rootState.qualityAssurance.pageFilters.filters.mode;
            const value = rootState.qualityAssurance.pageFilters.filters.value;

            if (mode) {
                events = events.filter(e => e.modes.includes(mode));
            }

            if (value) {
                events = events.filter(e =>
                    e.artistTitle.toLowerCase().includes(value.toLowerCase()) ||
                    e.creatorName.toLowerCase().includes(value.toLowerCase())
                );
            }

            return events;
        },
    },
};
