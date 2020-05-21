import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import DiscussionVotePage from './pages/DiscussionVotePage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        discussionVotes: [],
        userId: null,
        userModes: null,
        isNat: false,
        selectedDiscussionVoteId: null,
        filters: {
            mode: '',
            value: '',
        },
        pagination: {
            page: 1,
            limit: 12,
            maxPages: 1,
        },
    },
    mutations: {
        setDiscussionVotes (state, discussionVotes) {
            state.discussionVotes = discussionVotes;
        },
        setUserId (state, id) {
            state.userId = id;
        },
        setUserModes (state, modes) {
            state.userModes = modes;
        },
        setIsNat (state, value) {
            state.isNat = value;
        },
        setSelectedDiscussionVoteId (state, id) {
            state.selectedDiscussionVoteId = id;
        },

        // modify data
        updateDiscussionVote (state, discussionVote) {
            const i = state.discussionVotes.findIndex(d => d.id === discussionVote.id);
            if (i !== -1) Vue.set(state.discussionVotes, i, discussionVote);
        },
        addDiscussionVote (state, discussionVote) {
            state.discussionVotes.unshift(discussionVote);
        },

        // filters
        setFilterMode (state, mode) {
            state.filters.mode = mode;
        },
        setFilterValue (state, value) {
            state.filters.value = value;
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
        allDiscussionVotes: (state) => {
            return state.discussionVotes;
        },

        // page discussion votes
        filteredDiscussionVotes: (state) => {
            let discussionVotes = [...state.discussionVotes];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                discussionVotes = discussionVotes.filter(d => d.mode === mode);
            }

            if (state.filters.value.length) {
                discussionVotes = discussionVotes.filter(d => {
                    return d.title.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return discussionVotes;
        },
        activeDiscussionVotes: (state, getters) => {
            return getters.filteredDiscussionVotes.filter(d => d.isActive);
        },
        inactiveDiscussionVotes: (state, getters) => {
            return getters.filteredDiscussionVotes.filter(d => !d.isActive);
        },
        paginatedInactiveDiscussionVotes: (state, getters) => {
            return getters.inactiveDiscussionVotes.slice(
                state.pagination.limit * (state.pagination.page - 1),
                state.pagination.limit * state.pagination.page
            );
        },
        selectedDiscussionVote: (state) => {
            return state.discussionVotes.find(d => d.id === state.selectedDiscussionVoteId);
        },
    },
    actions: {
        updateDiscussionVote ({ commit, state }, discussionVote) {
            commit('updateDiscussionVote', discussionVote);

            if (state.selectedDiscussionVoteId && state.selectedDiscussionVoteId === discussionVote.id) {
                commit('setSelectedDiscussionVoteId', discussionVote.id);
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
            const maxPages = Math.ceil(getters.inactiveDiscussionVotes.length / state.pagination.limit);

            commit('updatePaginationMaxPages', maxPages);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        DiscussionVotePage,
    },
});
