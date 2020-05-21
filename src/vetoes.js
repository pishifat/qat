import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import VetoesPage from './pages/VetoesPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        vetoes: [],
        userId: null,
        userOsuId: null,
        isNat: false,
        selectedVetoId: null,
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
        setVetoes (state, vetoes) {
            state.vetoes = vetoes;
        },
        setUserId (state, id) {
            state.userId = id;
        },
        setUserOsuId (state, id) {
            state.userOsuId = id;
        },
        setIsNat (state, value) {
            state.isNat = value;
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
        allVetoes: (state) => {
            return state.vetoes;
        },

        // page vetoes
        filteredVetoes: (state) => {
            let vetoes = [...state.vetoes];

            if (state.filters.mode.length) {
                const mode = state.filters.mode;

                vetoes = vetoes.filter(v => v.mode === mode);
            }

            if (state.filters.value.length) {
                vetoes = vetoes.filter(v => {
                    return v.beatmapTitle.toLowerCase().includes(state.filters.value.toLowerCase()) ||
                    v.beatmapMapper.toLowerCase().includes(state.filters.value.toLowerCase());
                });
            }

            return vetoes;
        },
        activeVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status === 'available' || v.status == 'wip');
        },
        resolvedVetoes: (state, getters) => {
            return getters.filteredVetoes.filter(v => v.status !== 'available' && v.status !== 'wip');
        },
        paginatedResolvedVetoes: (state, getters) => {
            return getters.resolvedVetoes.slice(
                state.pagination.limit * (state.pagination.page - 1),
                state.pagination.limit * state.pagination.page
            );
        },

        // selected veto
        selectedVeto: (state) => {
            return state.vetoes.find(v => v.id === state.selectedVetoId);
        },
        currentMediators: (state, getters) => {
            let veto = getters.selectedVeto;
            let userIds = [];

            veto.mediations.forEach(mediation => {
                userIds.push(mediation.mediator.id);
            });

            return userIds;
        },
        isMediator: (state, getters) => {
            return getters.currentMediators.indexOf(state.userId) >= 0;
        },
        majorityUphold: (state, getters) => {
            let total = 0;

            getters.selectedVeto.mediations.forEach(mediation => {
                if (mediation.vote === 1) total++;
                if (mediation.vote === 3) total--;
            });

            return total > 0 ? true : false;
        },
    },
    actions: {
        updateVeto ({ commit, state }, veto) {
            commit('updateVeto', veto);

            if (state.selectedVetoId && state.selectedVetoId === veto.id) {
                commit('setSelectedVetoId', veto.id);
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
            const maxPages = Math.ceil(getters.resolvedVetoes.length / state.pagination.limit);

            commit('updatePaginationMaxPages', maxPages);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        VetoesPage,
    },
});
