import pageFilters from './modules/pageFilters';
import pagination from './modules/pagination';

export default {
    namespaced: true,
    modules: {
        pageFilters,
        pagination,
    },
    state: {
        selectedDiscussionId: null,
        selectedDiscussionData: null,
        activeDiscussions: [],
        archivedDiscussions: [],
        archivedPagination: { page: 1, limit: 21, totalCount: 0, totalPages: 1 },
    },
    mutations: {
        setSelectedDiscussionId(state, value) {
            state.selectedDiscussionId = value;
        },
        setSelectedDiscussion(state, discussion) {
            state.selectedDiscussionData = discussion;
        },
        setDiscussionListData(state, { active, archived }) {
            if (active) state.activeDiscussions = active;
            if (archived) {
                state.archivedDiscussions = archived.discussions || [];
                state.archivedPagination = {
                    page: archived.page || 1,
                    limit: archived.limit || 21,
                    totalCount: archived.totalCount || 0,
                    totalPages: archived.totalPages || 1,
                };
            }
        },
        setArchivedPage(state, page) {
            state.archivedPagination = { ...state.archivedPagination, page };
        },
        updateDiscussion(state, discussion) {
            if (state.selectedDiscussionData && state.selectedDiscussionData.id === discussion.id) {
                state.selectedDiscussionData = discussion;
            }
            const activeIdx = state.activeDiscussions.findIndex(d => d.id === discussion.id);
            if (activeIdx !== -1) {
                if (discussion.isActive) {
                    state.activeDiscussions.splice(activeIdx, 1, discussion);
                } else {
                    state.activeDiscussions.splice(activeIdx, 1);
                }
            }
            const archivedIdx = state.archivedDiscussions.findIndex(d => d.id === discussion.id);
            if (archivedIdx !== -1) {
                if (!discussion.isActive) {
                    state.archivedDiscussions.splice(archivedIdx, 1, discussion);
                } else {
                    state.archivedDiscussions.splice(archivedIdx, 1);
                }
            }
            if (!discussion.isActive && archivedIdx === -1 && activeIdx !== -1) {
                state.archivedDiscussions.unshift(discussion);
            }
            if (discussion.isActive && activeIdx === -1 && archivedIdx !== -1) {
                state.activeDiscussions.unshift(discussion);
            }
        },
        addDiscussion(state, discussion) {
            state.activeDiscussions.unshift(discussion);
        },
    },
    getters: {
        activeDiscussionsList: (state) => state.activeDiscussions,
        archivedDiscussionsList: (state) => state.archivedDiscussions,
        selectedDiscussion: (state) => state.selectedDiscussionData,
    },
};
