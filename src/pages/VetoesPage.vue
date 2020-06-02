<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <button class="btn btn-block btn-nat my-1" data-toggle="modal" data-target="#addVeto">
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
                    @show-newer="showNewer()"
                    @show-older="showOlder()"
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
import ToastMessages from '../components/ToastMessages.vue';
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';
import postData from '../mixins/postData.js';

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
    mixins: [postData],
    computed: {
        ...mapState([
            'pagination',
        ]),
        ...mapGetters([
            'allVetoes',
            'activeVetoes',
            'resolvedVetoes',
            'paginatedResolvedVetoes',
        ]),
    },
    watch: {
        paginatedResolvedVetoes () {
            this.$store.dispatch('updatePaginationMaxPages');
        },
    },
    async created () {
        const res = await this.executeGet('/vetoes/relevantInfo/');

        if (res) {
            this.$store.commit('setVetoes', res.vetoes);
            this.$store.commit('setUserId', res.userId);
            this.$store.commit('setUserOsuId', res.userOsuId);
            this.$store.commit('setIsNat', res.isNat);
            this.$store.commit('setIsUser', res.isUser);

            const params = new URLSearchParams(document.location.search);
            const id = params.get('id');

            if (id && id.length) {
                const i = this.allVetoes.findIndex(v => v.id == id);

                if (i >= 0) {
                    this.$store.commit('setSelectedVetoId', id);
                    $('#extendedInfo').modal('show');
                }
            }
        }

        $('#loading').fadeOut();
        $('#main')
            .attr('style', 'visibility: visible')
            .hide()
            .fadeIn();
    },
    mounted () {
        setInterval(async () => {
            const res = await this.executeGet('/vetoes/relevantInfo/');

            if (res) {
                this.$store.commit('setVetoes', res.vetoes);
            }
        }, 21600000);
    },
    methods: {
        showOlder() {
            this.$store.commit('increasePaginationPage');
        },
        showNewer() {
            this.$store.commit('decreasePaginationPage');
        },
    },
};
</script>
