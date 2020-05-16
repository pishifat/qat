const toastsModule = {
    namespace: false,
    state: {
        toastMessages: [],
    },
    mutations: {
        addToastMessage (state, message) {
            state.toastMessages.push(message);
        },
        removeFirstToastMessage (state) {
            state.toastMessages.splice(0, 1);
        },
    },
    actions: {
        updateToastMessages ({ commit }, message) {
            commit('addToastMessage', message);

            setTimeout(() => {
                commit('removeFirstToastMessage');
            }, 3500);
        },
    },
};

export default toastsModule;
