export default {
    namespaced: true,
    state: () => ({
        limit: 12,
        archivedAppsPage: 1,
        archivedAppsMaxPages: 1,
        archivedCurrentBnEvalsPage: 1,
        archivedCurrentBnEvalsMaxPages: 1,
    }),
    mutations: {
        resetPagination (state) {
            state.archivedAppsPage = 1;
            state.archivedCurrentBnEvalsPage = 1;
        },
        /* archived apps pagination */
        increaseArchivedAppsPage (state) {
            state.archivedAppsPage += 1;
        },
        decreaseArchivedAppsPage (state) {
            state.archivedAppsPage -= 1;
        },
        updateArchivedAppsMaxPages (state, maxPages) {
            state.archivedAppsMaxPages = maxPages;
        },
        /* archived bn evals pagination */
        increaseArchivedCurrentBnEvalsPage (state) {
            state.archivedCurrentBnEvalsPage += 1;
        },
        decreaseArchivedCurrentBnEvalsPage (state) {
            state.archivedCurrentBnEvalsPage -= 1;
        },
        updateArchivedCurrentBnEvalsMaxPages (state, maxPages) {
            state.archivedCurrentBnEvalsMaxPages = maxPages;
        },
    },
    actions: {
        updateArchivedAppsMaxPages ({ state, commit }, length) {
            const maxPages = Math.ceil(length / state.limit);

            commit('resetPagination');
            commit('updateArchivedAppsMaxPages', maxPages);
        },

        updateArchivedCurrentBnEvalsMaxPages ({ state, commit }, length) {
            const maxPages = Math.ceil(length / state.limit);

            commit('resetPagination');
            commit('updateArchivedCurrentBnEvalsMaxPages', maxPages);
        },
    },
};
