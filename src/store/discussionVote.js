import Vue from 'vue';
import pageFilters from './modules/pageFilters';
import pagination from './modules/pagination';

export default {
    namespaced: true,
    modules: {
        pageFilters,
        pagination,
    },
    state: {
        discussionVotes: [],
        selectedDiscussionVoteId: null,
    },
    mutations: {
        setDiscussionVotes (state, discussionVotes) {
            state.discussionVotes = discussionVotes;
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
    },
    getters: {
        // page discussion votes
        filteredDiscussionVotes: (state, getters, rootState) => {
            let discussionVotes = [...state.discussionVotes];
            const mode = rootState.discussionVote.pageFilters.filters.mode;
            const value = rootState.discussionVote.pageFilters.filters.value;

            if (mode) {
                discussionVotes = discussionVotes.filter(d => d.mode === mode);
            }

            if (value) {
                discussionVotes = discussionVotes.filter(d =>
                    d.title.toLowerCase().includes(value.toLowerCase())
                );
            }

            return discussionVotes;
        },
        activeDiscussionVotes: (state, getters) => {
            return getters.filteredDiscussionVotes.filter(d => d.isActive);
        },
        inactiveDiscussionVotes: (state, getters) => {
            return getters.filteredDiscussionVotes.filter(d => !d.isActive);
        },
        paginatedInactiveDiscussionVotes: (state, getters, rootState) => {
            const limit = rootState.discussionVote.pagination.limit;
            const page = rootState.discussionVote.pagination.page;

            return getters.inactiveDiscussionVotes.slice(
                limit * (page - 1),
                limit * page
            );
        },
        selectedDiscussionVote: (state) => {
            return state.discussionVotes.find(d => d.id === state.selectedDiscussionVoteId);
        },
    },
};
