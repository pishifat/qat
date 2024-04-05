export default {
    namespaced: true,
    state: () => ({
        filters: {
            mode: '',
            value: '',
            group: '',
            consensus: null,
        },
    }),
    mutations: {
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
        },
        setFilterGroup (state, group) {
            state.filters.group = group;
        },
        setFilterConsensus (state, consensus) {
            state.filters.consensus = consensus;
        },
        resetFilters (state) {
            state.filters.mode = '';
            state.filters.value = '';
            state.filters.group = '';
        },
    },
};
