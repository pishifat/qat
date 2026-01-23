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
        vetoes: [],
        selectedVetoId: null,
    },
    mutations: {
        setVetoes (state, vetoes) {
            state.vetoes = vetoes;
        },
        setSelectedVetoId (state, value) {
            state.selectedVetoId = value;
        },

        // modify data
        updateVeto (state, veto) {
            const i = state.vetoes.findIndex(v => v.id === veto.id);
            if (i !== -1) Vue.set(state.vetoes, i, veto);
        },
        addVeto (state, veto) {
            state.vetoes.unshift(veto);
        },
    },
    getters: {
        // page vetoes
        filteredVetoes: (state, getters, rootState) => {
            let vetoes = [...state.vetoes];
            const mode = rootState.vetoes.pageFilters.filters.mode;
            const value = rootState.vetoes.pageFilters.filters.value;

            if (mode) {
                vetoes = vetoes.filter(v => v.mode === mode);
            }

            if (value) {
                vetoes = vetoes.filter(v =>
                    v.beatmapTitle.toLowerCase().includes(value.toLowerCase()) ||
                    v.beatmapMapper.toLowerCase().includes(value.toLowerCase())
                );
            }

            return vetoes;
        },
        pendingVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'pending');
        },
        activeVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'chatroom' || v.status === 'available' || v.status == 'wip');
        },
        resolvedVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status == 'archive');
        },
        paginatedResolvedVetoes: (state, getters, rootState) => {
            const limit = rootState.vetoes.pagination.limit;
            const page = rootState.vetoes.pagination.page;

            return getters.resolvedVetoes.slice(
                limit * (page - 1),
                limit * page
            );
        },

        // selected veto
        selectedVeto: (state) => {
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
    },
};
