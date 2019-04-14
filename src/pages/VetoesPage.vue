<template>
    <div class="row">
        <div class="col-md-12">
            <section class="row segment segment-solid my-1 mb-3">
                <small
                    >Search:
                    <input
                        id="search"
                        class="ml-1"
                        v-model="filterValue"
                        type="text"
                        placeholder="beatmap..."
                    />
                </small>
                <small class="ml-1">
                    <select class="custom-select" id="mode" v-model="filterMode">
                        <option class="ml-2" value="" selected>All modes</option>
                        <option class="ml-2" value="osu">osu!</option>
                        <option class="ml-2" value="taiko">osu!taiko</option>
                        <option class="ml-2" value="catch">osu!catch</option>
                        <option class="ml-2" value="mania">osu!mania</option>
                    </select>
                </small>

                <button class="btn btn-sm btn-nat ml-3" data-toggle="modal" data-target="#addVeto">
                    Submit veto
                </button>
            </section>
            
            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <button
                        v-if="!(pre > 0)"
                        class="btn btn-sm btn-nat mx-auto my-2"
                        style="
                            display: block;
                            position: absolute;
                            left: -5px;
                            top: 0;
                            height: 100%;
                            border-radius: 0;
                            padding: 0;
                            margin: 0;
                            padding-right: 5px;"
                        type="button"
                        @click="showNewer()"
                    >
                        <i class="fas fa-angle-left"></i>
                    </button>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <veto-card
                            v-for="veto in pageObjs"
                            :key="veto.id"
                            :veto="veto"
                            :userId="userId"
                            @update:selectedVeto="selectedVeto = $event"
                        ></veto-card>
                    </transition-group>
                    <div class="row d-flex justify-content-center mt-2">
                        <div class="small text-center mx-auto">{{ currentPage }} of {{ pages }}</div>
                    </div>
                    <button
                        v-if="!canShowOlder"
                        class="btn btn-sm btn-nat"
                        style="
                            display: block;
                            position: absolute;
                            right: -5px;
                            top: 0;
                            height: 100%;
                            border-radius: 0;
                            padding: 0;
                            margin: 0;
                            padding-right: 5px;"
                        type="button"
                        @click="showOlder()"
                    >
                        <i class="fas fa-angle-right"></i>
                    </button>
                </div>
            </section>
        </div>
        <veto-info
            :veto="selectedVeto"
            :user-id="userId"
            :is-leader="isLeader"
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
            this.allObjs.push(v);
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
            isLeader: null,
            selectedVeto: null,
        };
    },
    created() {
        axios
            .get('/vetoes/relevantInfo')
            .then(response => {
                this.allObjs = response.data.vetoes;
                this.userId = response.data.userId;
                this.isLeader = response.data.isLeader;
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
