export default {
    namespaced: true,
    state: {
        users: [],
        selectedUserId: null,
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
            if (i !== -1) state.users[i] = user;
        },
    },
    getters: {
        selectedUser: (state) => {
            return state.users.find(u => u.id === state.selectedUserId);
        },
    },
};
