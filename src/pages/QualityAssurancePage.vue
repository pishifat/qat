<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <filter-box 
                    :filter-mode.sync="filterMode" 
                    :filter-value.sync="filterValue"
                    :placeholder="'metadata...'"
                    :options="['osu', 'taiko', 'catch', 'mania']"
                />
            </div>
        </div>
        <section class="segment segment-image mx-0 px-0">
            <div class="col-sm-12">
                <transition-group name="list" tag="div">
                    <event-row
                        v-for="event in pageObjs"
                        :key="event.id"
                        :event="event"
                        :user-id="userId"
                        :is-nat="isNat"
                        :user-osu-id="userOsuId"
                        :username="username"
                        :is-outdated="isOutdated(event.beatmapsetId, event.timestamp)"
                        :is-max-checks="event.qualityAssuranceCheckers.length > event.modes.length * 2 - 1"
                        @update-event="updateEvent($event)"
                    />
                </transition-group>
            </div>
            <div class="text-center">
                <button class="btn btn-sm btn-nat mt-4 mx-auto" @click="loadMore()">
                    <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
                </button>
            </div>
        </section>
    </div>
</template>

<script>
import filters from '../mixins/filters.js';
import FilterBox from '../components/FilterBox.vue';
import EventRow from '../components/qualityAssurance/EventRow.vue';

export default {
    name: 'QualityAssurancePage',
    components: {
        FilterBox,
        EventRow,
    },
    mixins: [filters],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            userId: null,
            userOsuId: null,
            username: null,
            isNat: null,
            limit: 50,
        };
    },
    computed: {
        sevenDaysAgo(){
            let date = new Date();
            date.setDate(date.getDate() - 7);
            return date;
        },
    },
    created() {
        axios
            .get('/qualityAssurance/relevantInfo')
            .then(response => {
                this.allObjs = response.data.maps;
                this.userId = response.data.userId;
                this.userOsuId = response.data.userOsuId;
                this.username = response.data.username;
                this.isNat = response.data.isNat;
                this.filterMode = response.data.mode;
                this.hasPagination = false;
                this.filter();
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
            axios.get('/qualityAssurance/relevantInfo').then(response => {
                this.allObjs = response.data.maps;
                if (this.isFiltered) {
                    this.filter();
                }
            });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(v) {
            if(v.metadata.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        isOutdated(beatmapsetId, timestamp) {
            if(new Date(timestamp) < this.sevenDaysAgo){
                return true;
            }else{
                const beatmaps = this.pageObjs.filter(b => b.beatmapsetId == beatmapsetId && b.timestamp != timestamp);
                let isOutdated = false;
                for (let i = 0; i < beatmaps.length; i++) {
                    const b = beatmaps[i];
                    if(new Date(b.timestamp) > new Date(timestamp)){
                        isOutdated = true;
                        break;
                    }
                }
                return isOutdated;
            }
        },
        updateEvent(event) {
            const i = this.allObjs.findIndex(e => e.id == event.id);
            this.allObjs[i] = event;
            this.filter();
        },
        loadMore(){
            axios
                .get('/qualityAssurance/loadMore/' + this.limit + '/' + (this.limit - 50))
                .then(response => {
                    this.allObjs = this.allObjs.concat(response.data.maps);
                    this.limit += 50;
                    this.filter();
                });
        },
    },
};
</script>

<style>
</style>
