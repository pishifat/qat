<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <button class="btn btn-sm btn-nat ml-2" data-toggle="modal" data-target="#addVeto">
                    Submit veto
                </button>
            </filter-box>

            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <h2>Active Vetoes <small v-if="activeVetoes">({{ activeVetoes.length }})</small></h2>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <veto-card
                            v-for="veto in activeVetoes"
                            :key="veto.id"
                            :veto="veto"
                        />
                    </transition-group>
                </div>
            </section>
            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <h2>Resolved Vetoes <small v-if="paginatedResolvedVetoes">({{ resolvedVetoes.length }})</small></h2>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <veto-card
                            v-for="veto in paginatedResolvedVetoes"
                            :key="veto.id"
                            :veto="veto"
                        />
                    </transition-group>
                    <button
                        v-if="pagination.page > 1"
                        class="btn btn-sm btn-pags btn-pags-left"
                        type="button"
                        @click="showNewer()"
                    >
                        <i class="fas fa-angle-left px-1" />
                    </button>
                    <button
                        v-if="pagination.page < pagination.maxPages"
                        class="btn btn-sm btn-pags btn-pags-right"
                        type="button"
                        @click="showOlder()"
                    >
                        <i class="fas fa-angle-right px-1" />
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
import ToastMessages from '../components/ToastMessages.vue';
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'VetoesPage',
    components: {
        ToastMessages,
        VetoCard,
        VetoInfo,
        SubmitVeto,
        FilterBox,
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
            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('id') && params.get('id').length) {
                const i = this.allVetoes.findIndex(v => v.id == params.get('id'));

                if (i >= 0) {
                    this.$store.commit('setSelectedVetoId', params.get('id'));
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
        }, 300000);
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
