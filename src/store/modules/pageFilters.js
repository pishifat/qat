export default {
    namespaced: true,
    state: () => ({
        filters: {
            mode: '',
            value: '',
        },
    }),
    mutations: {
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
        },
    },
};
