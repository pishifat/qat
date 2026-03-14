import pageFilters from './modules/pageFilters';
import pagination from './modules/pagination';

/** Mediations can be full array (detail) or just length number (list). */
function mediationCount(v) {
    if (!v) return 0;
    if (Array.isArray(v.mediations)) return v.mediations.length;
    if (typeof v.mediations === 'number') return v.mediations;
    return 0;
}

export default {
    namespaced: true,
    modules: {
        pageFilters,
        pagination,
    },
    state: {
        vetoes: [],
        selectedVetoId: null,
        selectedVetoData: null,
        activeVetoes: [],
        archivedVetoes: [],
        archivedPagination: { page: 1, limit: 24, totalCount: 0, totalPages: 1 },
    },
    mutations: {
        setVetoes (state, vetoes) {
            state.vetoes = vetoes;
        },
        setSelectedVetoId (state, value) {
            state.selectedVetoId = value;
        },
        setSelectedVeto (state, veto) {
            state.selectedVetoData = veto;
        },
        setVetoListData (state, { active, archived }) {
            if (active) state.activeVetoes = active;
            if (archived) {
                state.archivedVetoes = archived.vetoes || [];
                state.archivedPagination = {
                    page: archived.page || 1,
                    limit: archived.limit || 24,
                    totalCount: archived.totalCount || 0,
                    totalPages: archived.totalPages || 1,
                };
            }
        },
        setArchivedPage (state, page) {
            state.archivedPagination = { ...state.archivedPagination, page };
        },

        // modify data
        updateVeto (state, veto) {
            if (state.selectedVetoData && state.selectedVetoData.id === veto.id) {
                state.selectedVetoData = veto;
            }
            const i = state.vetoes.findIndex(v => v.id === veto.id);
            if (i !== -1) state.vetoes[i] = veto;
        },
        addVeto (state, veto) {
            state.vetoes.unshift(veto);
            state.activeVetoes.unshift(veto);
        },
    },
    getters: {
        // page vetoes
        filteredVetoes: (state, getters, rootState) => {
            let vetoes = [...state.activeVetoes, ...state.archivedVetoes];
            const mode = rootState.vetoes.pageFilters.filters.mode;
            const value = rootState.vetoes.pageFilters.filters.value;

            if (mode) {
                vetoes = vetoes.filter(v => v.mode === mode);
            }
            if (value) {
                vetoes = vetoes.filter(v =>
                    (v.beatmapTitle || '').toLowerCase().includes(value.toLowerCase()) ||
                    (v.beatmapMapper || '').toLowerCase().includes(value.toLowerCase())
                );
            }
            return vetoes;
        },
        pendingVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'pending');
        },
        chatroomVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'chatroom');
        },
        availableVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'available');
        },
        wipVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'wip');
        },
        resolvedVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status == 'archive');
        },
        needsConsensusVetoes: (state, getters) => {
            return getters.resolvedVetoes.filter(v =>
                v.vetoFormat >= 7 &&
                mediationCount(v) > 0 &&
                v.reasons && v.reasons.some(r => r.status !== 'upheld' && r.status !== 'dismissed')
            );
        },
        fullyResolvedVetoes: (state, getters) => {
            return getters.resolvedVetoes.filter(v =>
                v.vetoFormat < 7 ||
                mediationCount(v) === 0 ||
                !v.reasons || v.reasons.every(r => r.status === 'upheld' || r.status === 'dismissed')
            );
        },
        paginatedResolvedVetoes: (state, getters) => {
            return getters.fullyResolvedVetoes;
        },

        // selected veto (from detail fetch or from vetoes list)
        selectedVeto: (state) => {
            if (state.selectedVetoData) return state.selectedVetoData;
            return state.vetoes.find(v => v.id === state.selectedVetoId);
        },
        isMediator: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto) return false;

            return getters.selectedVeto.mediations.some(m =>
                rootState.loggedInUser && m.mediator && m.mediator.id == rootState.loggedInUser.id
            );
        },
        isVetoer: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.vetoer) return false;

            return getters.selectedVeto.vetoer.id == rootState.loggedInUser.id;
        },
        isVouchingUser: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.vouchingUsers) return false;

            const vouchingUserIds = getters.selectedVeto.vouchingUsers.map(u => u.id);

            return vouchingUserIds.includes(rootState.loggedInUser.id);
        },
        isChatroomUser: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.chatroomUsers) return false;

            const chatroomUserIds = getters.selectedVeto.chatroomUsers.map(u => u.id);

            return chatroomUserIds.includes(rootState.loggedInUser.id);
        },
        isChatroomUserPublic: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.chatroomUsersPublic) return false;

            const chatroomUserIds = getters.selectedVeto.chatroomUsersPublic.map(u => u.id);

            return chatroomUserIds.includes(rootState.loggedInUser.id);
        },
        isMapper: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto) return false;

            return getters.selectedVeto.beatmapMapperId == rootState.loggedInUser.osuId;
        },
        isChatroomMediationRequestedUser: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.chatroomMediationRequestedUsers) return false;

            const chatroomUserIds = getters.selectedVeto.chatroomMediationRequestedUsers.map(u => u.id);

            return chatroomUserIds.includes(rootState.loggedInUser.id);
        },
        isChatroomUpholdVoter: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.chatroomUpholdVoters) return false;

            const chatroomUpholdUserIds = getters.selectedVeto.chatroomUpholdVoters.map(u => u.id);

            return chatroomUpholdUserIds.includes(rootState.loggedInUser.id);
        },
        isChatroomDismissVoter: (state, getters, rootState) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.chatroomDismissVoters) return false;

            const chatroomDismissUserIds = getters.selectedVeto.chatroomDismissVoters.map(u => u.id);

            return chatroomDismissUserIds.includes(rootState.loggedInUser.id);
        },
        alreadyVoted: (state, getters) => {
            return getters.isChatroomUpholdVoter || getters.isChatroomMediationRequestedUser;
        },
        mediationsGroup1: (state, getters, rootState) => (reasonIndex) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.mediations) return [];

            const reasonFilteredMediations = getters.selectedVeto.mediations.filter(m => m.reasonIndex == reasonIndex);

            return reasonFilteredMediations.filter((_, i) => i % 2 === 0);
        },
        mediationsGroup2: (state, getters, rootState) => (reasonIndex) => {
            if (!rootState.loggedInUser || !getters.selectedVeto || !getters.selectedVeto.mediations) return [];

            const reasonFilteredMediations = getters.selectedVeto.mediations.filter(m => m.reasonIndex == reasonIndex);

            return reasonFilteredMediations.filter((_, i) => i % 2 === 1);
        },
    },
};
