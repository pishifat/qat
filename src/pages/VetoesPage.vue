<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :filter-mode.sync="filterMode"
                :filter-value.sync="filterValue"
                :placeholder="'beatmap...'"
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
                            @update:selectedVeto="selectedVeto = $event"
                        />
                    </transition-group>
                </div>
            </section>
            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <h2>Resolved Vetoes <small v-if="resolvedVetoes">({{ resolvedVetoes.length }})</small></h2>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <veto-card
                            v-for="veto in resolvedVetoes"
                            :key="veto.id"
                            :veto="veto"
                            @update:selectedVeto="selectedVeto = $event"
                        />
                    </transition-group>
                </div>
            </section>
        </div>
        <veto-info
            :veto="selectedVeto"
            :user-id="userId"
            :user-osu-id="userOsuId"
            :is-nat="isNat"
            @update-veto="updateVeto($event)"
            @update-mediation="updateMediation($event)"
        />
        <submit-veto @submit-veto="submitVeto($event)" />
    </div>
</template>

<script>
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'VetoesPage',
    components: {
        VetoCard,
        VetoInfo,
        SubmitVeto,
        FilterBox,
    },
    mixins: [pagination, filters, postData],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            activeVetoes: null,
            resolvedVetoes: null,
            filteredObjs: null,
            userId: null,
            userOsuId: null,
            isNat: false,
            selectedVeto: null,
        };
    },
    async created () {
        const res = await this.executeGet('/vetoes/relevantInfo/');

        if (res) {
            this.allObjs = res.vetoes;
            this.userId = res.userId;
            this.userOsuId = res.userOsuId;
            this.isNat = res.isNat;
            this.hasPagination = false;
            this.hasSeparation = true;
            this.filter();
            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('beatmap') && params.get('beatmap').length) {
                const i = this.allObjs.findIndex(v => v.id == params.get('beatmap'));

                if (i >= 0) {
                    this.selectedVeto = this.allObjs[i];
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
                this.allObjs = res.vetoes;

                if (this.isFiltered) {
                    this.filter();
                }
            }
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(v) {
            if (v.beatmapTitle.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) {
                return true;
            }

            return false;
        },

        separateObjs () {
            this.activeVetoes = this.pageObjs.filter(v => v.status === 'wip' || v.status === 'available');
            this.resolvedVetoes = this.pageObjs.filter(v => v.status !== 'wip' && v.status !== 'available');
        },

        submitVeto (v) {
            this.allObjs.unshift(v);
            this.filter();
        },

        updateVeto (v) {
            const i = this.allObjs.findIndex(veto => veto.id === v.id);
            this.allObjs[i] = v;
            this.selectedVeto = v;
            this.filter();
        },
    },
};
</script>
