<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="vetoes"
            >
                <button class="btn btn-block btn-primary my-1" data-toggle="modal" data-target="#addVeto">
                    Submit veto
                </button>
            </filter-box>

            <section class="card card-body">
                <h2>Active Vetoes <small v-if="activeVetoes">({{ activeVetoes.length }})</small></h2>

                <transition-group name="list" tag="div" class="row">
                    <veto-card
                        v-for="veto in activeVetoes"
                        :key="veto.id"
                        :veto="veto"
                    />
                </transition-group>
            </section>

            <section class="card card-body">
                <h2>Resolved Vetoes <small v-if="paginatedResolvedVetoes">({{ resolvedVetoes.length }})</small></h2>

                <transition-group name="list" tag="div" class="row">
                    <veto-card
                        v-for="veto in paginatedResolvedVetoes"
                        :key="veto.id"
                        :veto="veto"
                    />
                </transition-group>

                <pagination-nav
                    store-module="vetoes"
                />
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
    computed: {
        ...mapState('vetoes', [
            'vetoes',
        ]),
        ...mapGetters('vetoes', [
            'activeVetoes',
            'resolvedVetoes',
            'paginatedResolvedVetoes',
        ]),
    },
    watch: {
        resolvedVetoes (v) {
            this.$store.dispatch('vetoes/pagination/updateMaxPages', v.length);
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('vetoes')) {
            this.$store.registerModule('vetoes', vetoesModule);
        }
    },
    async created () {
        if (this.vetoes.length) return;

        const data = await this.$http.initialRequest('/vetoes/relevantInfo');

        if (data.vetoes) {
            this.$store.commit('vetoes/setVetoes', data.vetoes);

            const id = this.$route.query.id;

            if (id) {
                const i = this.vetoes.findIndex(v => v.id == id);

                if (i >= 0) {
                    this.$store.commit('vetoes/setSelectedVetoId', id);
                    $('#extendedInfo').modal('show');
                }
            }
        }
    },
    mounted () {
        setInterval(async () => {
            const res = await this.$http.executeGet('/vetoes/relevantInfo/');

            if (res) {
                this.$store.commit('vetoes/setVetoes', res.vetoes);
            }
        }, 21600000);
    },
};
</script>
