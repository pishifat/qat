<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box 
                :filterMode.sync="filterMode" 
                :filterValue.sync="filterValue"
                :placeholder="'beatmap...'"
            >
                <button class="btn btn-sm btn-nat ml-2" data-toggle="modal" data-target="#addVeto">
                    Submit veto
                </button>
            </filter-box>
            
            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <veto-card
                            v-for="veto in pageObjs"
                            :key="veto.id"
                            :veto="veto"
                            :userId="userId"
                            @update:selectedVeto="selectedVeto = $event"
                        ></veto-card>
                    </transition-group>
                </div>
            </section>
        </div>
        <veto-info
            :veto="selectedVeto"
            :user-id="userId"
            :user-osu-id="userOsuId"
            :is-nat="isNat || isSpectator"
            :is-spectator="isSpectator"
            @update-veto="updateVeto($event)"
        ></veto-info>
        <submit-veto @submit-veto="SubmitVeto($event)"></submit-veto>
    </div>
</template>

<script>
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';

export default {
    name: 'vetoes-page',
    components: {
        VetoCard,
        VetoInfo,
        SubmitVeto,
        FilterBox,
    },
    mixins: [pagination, filters],
    methods: {
        filterBySearchValueContext: function(v) {
            if(v.beatmapTitle.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        SubmitVeto: function(v) {
            this.allObjs.unshift(v);
            this.filter();
        },
        updateVeto: function(v) {
            const i = this.allObjs.findIndex(veto => veto.id == v.id);
            this.allObjs[i] = v;
            this.selectedVeto = v;
            this.filter();
        },
    },
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            userId: null,
            userOsuId: null,
            isNat: false,
            isSpectator: false,
            selectedVeto: null,
        };
    },
    created() {
        axios
            .get('/vetoes/relevantInfo')
            .then(response => {
                this.allObjs = response.data.vetoes;
                this.userId = response.data.userId;
                this.userOsuId = response.data.userOsuId;
                this.isNat = response.data.isNat;
                this.isSpectator = response.data.isSpectator;
                this.limit = 24;
            })
            .then(function() {
                $('#loading').fadeOut();
                $('#main')
                    .attr('style', 'visibility: visible')
                    .hide()
                    .fadeIn();
            });
    },
    mounted() {
        setInterval(() => {
            axios.get('/vetoes/relevantInfo').then(response => {
                this.allObjs = response.data.vetoes;
                if (this.isFiltered) {
                    this.filter();
                }
            });
        }, 300000);
    },
};
</script>

<style>
</style>
