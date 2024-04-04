<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="vetoes"
            >
                <button
                    class="btn btn-block btn-primary my-1"
                    data-toggle="modal"
                    data-target="#addVeto"
                >
                    Submit veto
                </button>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Active vetoes
                    <small v-if="activeVetoes"
                        >({{ activeVetoes.length }})</small
                    >
                </h2>

                <transition-group name="list" tag="div" class="row">
                    <veto-card
                        v-for="veto in activeVetoes"
                        :key="veto.id"
                        :veto="veto"
                    />
                </transition-group>
            </section>

            <section class="card card-body">
                <h2>
                    Archived vetoes
                    <small v-if="paginatedResolvedVetoes">
                        ({{ resolvedVetoes.length + (reachedMax ? '' : '+')}})
                    </small>
                    <button
                        v-if="!reachedMax"
                        type="button"
                        class="btn btn-primary ml-2"
                        @click="showMore($event)"
                    >
                        Show more vetoes
                    </button>
                    <button
                        v-if="!reachedMax"
                        type="button"
                        class="btn btn-secondary ml-2"
                        @click="showAll($event)"
                    >
                        Show all vetoes
                    </button>
                </h2>

                <transition-group name="list" tag="div" class="row">
                    <veto-card
                        v-for="veto in paginatedResolvedVetoes"
                        :key="veto.id"
                        :veto="veto"
                    />
                </transition-group>

                <pagination-nav store-module="vetoes" />
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
            skip: 20,
            limit: 20,
            reachedMax: false,
        };
    },
    computed: {
        ...mapState('vetoes', ['vetoes']),
        ...mapGetters('vetoes', [
            'activeVetoes',
            'resolvedVetoes',
            'paginatedResolvedVetoes',
        ]),
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
    },
};
</script>
