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
                    <small v-if="status.isArchive && status.vetoes.length">
                        ({{ resolvedVetoes.length + (reachedMax ? '' : '+') }})
                    </small>
                    <small v-else-if="status.vetoes.length">
                        ({{ status.vetoes.length }})
                    </small>
                    <button
                        v-if="status.isArchive && !reachedMax"
                        type="button"
                        class="btn btn-primary ms-2"
                        @click="showMore($event)"
                    >
                        Show more vetoes
                    </button>
                    <button
                        v-if="status.isArchive && !reachedMax"
                        type="button"
                        class="btn btn-secondary ms-2"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="This takes a long time to load"
                        @click="showAll($event)"
                    >
                        Show all vetoes
                    </button>
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

                <pagination-nav v-if="status.isArchive" store-module="vetoes" />
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

        <veto-info />

        <submit-veto />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import vetoesModule from '../store/vetoes';
import ToastMessages from '../components/ToastMessages.vue';
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';

export default {
    name: 'VetoesPage',
    components: {
        ToastMessages,
        VetoCard,
        VetoInfo,
        SubmitVeto,
        FilterBox,
        PaginationNav,
    },
    data() {
        return {
            skip: 6,
            limit: 6,
            reachedMax: false,
            oldVetoId: '',
            newVetoId: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('vetoes', ['vetoes']),
        ...mapGetters('vetoes', [
            'pendingVetoes',
            'chatroomVetoes',
            'availableVetoes',
            'wipVetoes',
            'resolvedVetoes',
            'paginatedResolvedVetoes',
        ]),
        vetoStatuses() {
            const statuses = [
                { id: 'pending', label: 'Pending Vetoes', vetoes: this.pendingVetoes, isArchive: false },
                { id: 'chatroom', label: 'Active Chatrooms', vetoes: this.chatroomVetoes, isArchive: false },
                { id: 'available', label: 'Vetoes Requesting Mediation', vetoes: this.availableVetoes, isArchive: false },
                { id: 'wip', label: 'Mediation in Progress', vetoes: this.wipVetoes, isArchive: false },
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
        resolvedVetoes(v) {
            this.$store.dispatch('vetoes/pagination/updateMaxPages', v.length);
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('vetoes')) {
            this.$store.registerModule('vetoes', vetoesModule);
        }
    },
    async created() {
        if (this.vetoes.length) return;

        const id = this.$route.query.id;

        if (!id) await this.showMore(null, true);

        else {
            const veto = await this.$http.initialRequest(
                `/vetoes/searchVeto/${id}`
            );

            if (this.$http.isValid(veto)) {
                this.$store.commit('vetoes/setVetoes', [veto]);
                this.$store.commit('vetoes/setSelectedVetoId', id);
                $('#extendedInfo').modal('show');
            } else {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Veto not found',
                    type: 'danger',
                });
            }
        }
    },
    mounted() {
        setInterval(async () => {
            this.limit -= this.skip;
            await this.showMore(null);
        }, 21600000);
    },
    methods: {
        async showMore(e, firstLoad) {
            this.limit += this.skip;

            const startVetoesCount = this.vetoes.length;

            let data;

            if (firstLoad) {
                data = await this.$http.initialRequest(
                    `/vetoes/relevantInfo/${this.limit}`
                );
            } else {
                data = await this.$http.executeGet(
                    `/vetoes/relevantInfo/${this.limit}`,
                    e
                );
            }

            if (data.vetoes) {
                this.$store.commit('vetoes/setVetoes', data.vetoes);

                if (data.vetoes.length == startVetoesCount) {
                    this.reachedMax = true;
                }
            }
        },
        async showAll(e) {
            const result = confirm(`Are you sure? This will take a while.`);

            if (result) {
                this.limit = 10000;
                this.reachedMax = true;
                await this.showMore(e);
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
