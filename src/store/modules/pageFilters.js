export default {
    namespaced: true,
    state: () => ({
        filters: {
            mode: '',
            value: '',
            group: '',
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
    },
};
