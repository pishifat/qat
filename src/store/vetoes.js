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
        activeVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'available' || v.status == 'wip');
        },
        resolvedVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status !== 'available' && v.status !== 'wip');
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
            if (!getters.selectedVeto) return false;

            return getters.selectedVeto.mediations.some(m =>
                m.mediator && m.mediator.id == rootState.loggedInUser.id
            );
        },
    },
};
