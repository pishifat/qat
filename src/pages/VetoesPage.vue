<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="vetoes"
            >
                <div class="input-group ps-1">
                    <button
                        v-if="loggedInUser && loggedInUser.isBnOrNat"
                        class="btn w-100 btn-primary my-1 mt-3"
                        data-bs-toggle="modal"
                        data-bs-target="#addVeto"
                        :disabled="isProbation"
                    >
                        Submit anonymous veto
                    </button>
                </div>
            </filter-box>

            <section
                v-for="status in vetoStatuses"
                :key="status.id"
                class="card card-body"
            >
                <h2>
                    {{ status.label }}
                    <small v-if="status.isArchive && archivedPagination.totalCount">
                        ({{ archivedPagination.totalCount }})
                    </small>
                    <small v-else-if="status.vetoes.length">
                        ({{ status.vetoes.length }})
                    </small>
                </h2>

                <div v-if="!status.vetoes.length">
                    None...
                </div>

                <transition-group name="list" tag="div" class="row">
                    <veto-card
                        v-for="veto in status.vetoes"
                        :key="veto.id"
                        :veto="veto"
                    />
                </transition-group>

                <div v-if="status.isArchive && archivedLoading" class="text-center pt-3">
                    <div
                        class="spinner-border"
                        role="status"
                        style="height: 1.62rem; width: 1.62rem;"
                    >
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <pagination-nav v-else-if="status.isArchive" store-module="vetoes" />
            </section>
            <section v-if="loggedInUser && loggedInUser.isNatLeader" class="card card-body">
                <h2>Admin</h2>
                <span class="small text-secondary mb-2">
                    Note: reason order needs to match in both vetoes
                </span>
                <div class="d-flex flex-wrap align-items-center">
                    <input
                        v-model="oldVetoId"
                        class="form-control mb-2"
                        type="text"
                        placeholder="old veto ID..."
                    >
                    <input
                        v-model="newVetoId"
                        class="form-control mb-2"
                        type="text"
                        placeholder="new veto ID..."
                    >
                    <button
                        class="btn btn-sm btn-secondary mb-2 ms-2"
                        @click="migrateMediations"
                    >
                        Migrate mediations
                    </button>
                </div>
            </section>
        </div>

        <submit-veto />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import vetoesModule from '../store/vetoes';
import ToastMessages from '../components/ToastMessages.vue';
import VetoCard from '../components/vetoes/VetoCard.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';

export default {
    name: 'VetoesPage',
    components: {
        ToastMessages,
        VetoCard,
        SubmitVeto,
        FilterBox,
        PaginationNav,
    },
    data() {
        return {
            oldVetoId: '',
            newVetoId: '',
            archivedLoading: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('vetoes', ['archivedPagination']),
        ...mapGetters('vetoes', [
            'pendingVetoes',
            'chatroomVetoes',
            'availableVetoes',
            'wipVetoes',
            'resolvedVetoes',
            'needsConsensusVetoes',
            'fullyResolvedVetoes',
            'paginatedResolvedVetoes',
        ]),
        vetoStatuses() {
            const statuses = [
                { id: 'pending', label: 'Pending Vetoes', vetoes: this.pendingVetoes, isArchive: false },
                { id: 'chatroom', label: 'Active Chatrooms', vetoes: this.chatroomVetoes, isArchive: false },
                { id: 'available', label: 'Requesting Mediation', vetoes: this.availableVetoes, isArchive: false },
                { id: 'wip', label: 'Mediation in Progress', vetoes: this.wipVetoes, isArchive: false },
                { id: 'needsConsensus', label: 'Needs Consensus', vetoes: this.needsConsensusVetoes, isArchive: false },
                { id: 'archive', label: 'Archived Vetoes', vetoes: this.paginatedResolvedVetoes, isArchive: true },
            ];
            const canSeePending = this.loggedInUser && this.loggedInUser.isBnOrNat;

            return canSeePending ? statuses : statuses.filter(s => s.id !== 'pending');
        },
        isProbation () {
            return this.loggedInUser.probationModes.length > 0;
        },
    },
    watch: {
        'archivedPagination.page': {
            handler(page, oldPage) {
                if (page > 0 && oldPage !== undefined) this.fetchVetoList(page);
            },
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('vetoes')) {
            this.$store.registerModule('vetoes', vetoesModule);
        }
    },
    async created() {
        await this.fetchVetoList(1, true);
    },
    methods: {
        async fetchVetoList(archivedPage = 1, isInitialLoad = false) {
            const limit = 21;
            const url = `/v2/vetoes?archivedPage=${archivedPage}&limit=${limit}`;
            if (!isInitialLoad) this.archivedLoading = true;
            try {
                const data = isInitialLoad
                    ? await this.$http.initialRequest(url)
                    : await this.$http.executeGet(url);
                if (data && data.active !== undefined) {
                    this.$store.commit('vetoes/setVetoListData', {
                        active: data.active,
                        archived: data.archived,
                    });
                }
            } finally {
                if (!isInitialLoad) this.archivedLoading = false;
            }
        },
        async migrateMediations() {
            const result = confirm(`Are you sure?`);

            if (result) {
                const data = await this.$http.executePost(
                    '/vetoes/migrateMediations',
                    { oldVetoId: this.oldVetoId, newVetoId: this.newVetoId }
                );
            }
        },
    },
};
</script>
