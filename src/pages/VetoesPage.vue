<template>
    <div class="row">
        <div class="col-md-12">
            <section class="row segment segment-solid my-1 mb-3">
                <div class="small filter-box">
                    <span class="filter-header">Search</span>
                    <input
                        id="search"
                        class="ml-2"
                        v-model="filterValue"
                        type="text"
                        placeholder="beatmap..."
                        autocomplete="off"
                    />
                    <select class="custom-select ml-2" id="mode" v-model="filterMode">
                        <option value="" selected>All modes</option>
                        <option value="osu">osu!</option>
                        <option value="taiko">osu!taiko</option>
                        <option value="catch">osu!catch</option>
                        <option value="mania">osu!mania</option>
                    </select>

                    <button class="btn btn-sm btn-nat ml-2" data-toggle="modal" data-target="#addVeto">
                        Submit veto
                    </button>
                </div>
            </section>
            
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
            :is-nat="isNat"
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
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';

export default {
    name: 'vetoes-page',
    components: {
        VetoCard,
        VetoInfo,
        SubmitVeto,
    },
    mixins: [pagination, filters],
    methods: {
        filterBySearchValueContext: function() {
            //something with bm
            if (this.filterValue != '1111') {
                return true;
            } else {
                return false;
            }
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
