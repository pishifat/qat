import Vue from 'vue';
import pageFilters from './modules/pageFilters';
import pagination from './modules/pagination';

function getTotalDuration(dates) {
    let days = 0;

    for (let i = 0; i < dates.length; i += 2) {
        const startAt = new Date(dates[i]);
        const endedAt = dates[i+1] && new Date(dates[i+1]);
        let time = 0;

        if (endedAt) {
            time = endedAt - startAt;
        } else {
            time = new Date() - startAt;
        }

        days += Math.abs(time / (1000 * 3600 * 24));
    }

    return days;
}

export default {
    namespaced: true,
    modules: {
        pageFilters,
        pagination,
    },
    state: {
        users: [],
        selectedUserId: null,
        sort: {
            type: 'username',
            descend: true,
        },
    },
    mutations: {
        setUsers (state, users) {
            state.users = users;
        },
        setSelectedUserId (state, id) {
            state.selectedUserId = id;
        },

        // modify data
        updateUser (state, user) {
            const i = state.users.findIndex(u => u.id === user.id);
            if (i !== -1) Vue.set(state.users, i, user);
        },

        // sort
        setSortType (state, sortType) {
            state.sort.type = sortType;
        },
        setSortDescend (state, value) {
            state.sort.descend = value;
        },
    },
    getters: {
        selectedUser: (state) => {
            return state.users.find(u => u.id === state.selectedUserId);
        },
        filteredUsers: (state, getters, rootState) => {
            let users = [...state.users];
            const mode = rootState.users.pageFilters.filters.mode;
            const value = rootState.users.pageFilters.filters.value;

            if (mode) {
                users = users.filter(u => u.modes.includes(mode));
            }

            if (value) {
                users = users.filter(u => {
                    return u.username.toLowerCase().includes(value.toLowerCase());
                });
            }

            return users;
        },
        sortedUsers: (state, getters) => {
            let users = [...getters.filteredUsers];

            if (state.sort.type === 'username') {
                users.sort((a, b) =>
                    b.username.toLowerCase().localeCompare(a.username.toLowerCase())
                );
            } else if (state.sort.type === 'bnDuration' || state.sort.type === 'natDuration') {
                users.sort((a, b) => {
                    const aDuration = getTotalDuration(a[state.sort.type]);
                    const bDuration = getTotalDuration(b[state.sort.type]);

                    if (aDuration > bDuration) return 1;
                    if (aDuration < bDuration) return -1;

                    return 0;
                });
            }

            if (state.sort.descend) {
                users.reverse();
            }

            return users;
        },
        paginatedUsers: (state, getters, rootState) => {
            const limit = rootState.users.pagination.limit;
            const page = rootState.users.pagination.page;

            return getters.sortedUsers.slice(
                limit * (page - 1),
                limit * page
            );
        },
    },
    actions: {
        updateSorting ({ commit, state }, sortType) {
            if (state.sort.type !== sortType || state.sort.descend === false) {
                commit('setSortDescend', true);
            } else {
                commit('setSortDescend', false);
            }

            commit('setSortType', sortType);
        },
    },
};
