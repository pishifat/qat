import toastsModule from './modules/toasts';
import userActivity from './modules/userActivity';

export default {
    modules: {
        toasts: toastsModule,
        activity: userActivity,
    },
    state: {
        initialized: false,
        isLoading: false,
        loggedInUser: null,
        allUsersByMode: [],
    },
    getters: {
        userMainMode (state) {
            if (state.loggedInUser.modes && state.loggedInUser.modes.length) {
                return state.loggedInUser.modes[0];
            }

            return 'osu';
        },
    },
    mutations: {
        setInitialData (state, payload) {
            state.loggedInUser = payload.me;
            state.initialized = true;
        },
        setHomeData (state, allUsersByMode) {
            state.allUsersByMode = allUsersByMode;
        },
        updateLoadingState (state) {
            state.isLoading = !state.isLoading;
        },
    },
    strict: process.env.NODE_ENV !== 'production',
};
