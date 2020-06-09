import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import userActivityModule from './modules/userActivity';
import UsersPage from './pages/UsersPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
        userActivity: userActivityModule,
    },
    state: {
        users: [],
        userId: null,
        isNat: false,
        showOldUsers: false,
        selectedUserId: null,
        filters: {
            mode: '',
            value: '',
        },
        sort: {
            type: 'username',
            descend: true,
        },
        pagination: {
            page: 1,
            limit: 24,
            maxPages: 1,
        },
    },
    mutations: {
        setUsers (state, users) {
            state.users = users;
        },
        setUserId (state, id) {
            state.userId = id;
        },
        setIsNat (state, value) {
            state.isNat = value;
        },
        setShowOldUsers (state, value) {
            state.showOldUsers = value;
        },
        setSelectedUserId (state, id) {
            state.selectedUserId = id;
        },

        // modify data
        updateUser (state, user) {
            const i = state.users.findIndex(u => u.id === user.id);
            if (i !== -1) Vue.set(state.users, i, user);
        },

        // filters
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
        },

        // sort
        setSortType (state, sortType) {
            state.sort.type = sortType;
        },
        setSortDescend (state, value) {
            state.sort.descend = value;
        },

        // pagination
        increasePaginationPage (state) {
            state.pagination.page += 1;
        },
        decreasePaginationPage (state) {
            state.pagination.page -= 1;
        },
        resetPaginationPage (state) {
            state.pagination.page = 1;
        },
        updatePaginationMaxPages (state, value) {
            state.pagination.maxPages = value;
        },
    },
    getters: {
        filteredUsers: (state) => {
            let users = [...state.users];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                users = users.filter(u => u.modes.includes(mode));
            }

            if (state.filters.value.length) {
                users = users.filter(u => {
                    return u.username.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            if (state.sort.type === 'username') {
                users.sort((a, b) => b.username.toLowerCase().localeCompare(a.username.toLowerCase()));
            } else if (state.sort.type === 'bnDuration') {
                users.sort((a, b) => {
                    if (sortDuration(a.bnDuration) > sortDuration(b.bnDuration)) return -1;
                    if (sortDuration(a.bnDuration) < sortDuration(b.bnDuration)) return 1;

                    return 0;
                });
            } else if (state.sort.type === 'natDuration') {
                users.sort((a, b) => {
                    if (sortDuration(a.natDuration) > sortDuration(b.natDuration)) return -1;
                    if (sortDuration(a.natDuration) < sortDuration(b.natDuration)) return 1;

                    return 0;
                });
            }

            if (state.sort.descend) {
                users.reverse();
            }

            return users;
        },
        paginatedUsers: (state, getters) => {
            return getters.filteredUsers.slice(
                state.pagination.limit * (state.pagination.page - 1),
                state.pagination.limit * state.pagination.page
            );
        },
        allUsers: (state) => {
            return state.users;
        },
        selectedUser: (state) => {
            return state.users.find(u => u.id === state.selectedUserId);
        },
    },
    actions: {
        updateUser ({ commit, state }, user) {
            commit('updateUser', user);

            if (state.selectedUserId && state.selectedUserId === user.id) {
                commit('setSelectedUserId', user.id);
            }
        },
        updateFilterMode ({ commit }, mode) {
            commit('resetPaginationPage');
            commit('setFilterMode', mode);
        },
        updateFilterValue ({ commit }, value) {
            commit('resetPaginationPage');
            commit('setFilterValue', value);
        },
        updatePaginationMaxPages ({ commit, getters, state }) {
            const maxPages = Math.ceil(getters.filteredUsers.length / state.pagination.limit);

            commit('updatePaginationMaxPages', maxPages);
        },
        updateSorting ({ commit, state }, sortType) {
            if (state.sort.type !== sortType || state.sort.descend === false) {
                commit('setSortDescend', true);
            } else {
                commit('setSortDescend', false);
            }

            commit('resetPaginationPage');
            commit('setSortType', sortType);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

// used in filteredUsers getter
function sortDuration(dateArray) {
    let days = 0;

    for (let i = 0; i < dateArray.length; i+=2) {
        let a = new Date(dateArray[i]);
        let b = new Date(dateArray[i+1]);

        if (dateArray[i+1]) {
            days += (Math.abs(b.getTime() - a.getTime())) / (1000 * 3600 * 24);
        } else {
            days += (Math.abs(new Date().getTime() - a.getTime())) / (1000 * 3600 * 24);
        }
    }

    return days;
}

new Vue({
    el: '#app',
    store,
    components: {
        UsersPage,
    },
});
