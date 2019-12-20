<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <filter-box 
                    :filter-mode.sync="filterMode" 
                    :filter-value.sync="filterValue"
                    :placeholder="'metadata...'"
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
                        @update-event="updateEvent($event)"
                    />
                </transition-group>
            </div>
        </section>
    </div>
</template>

<script>
import filters from '../mixins/filters.js';
import FilterBox from '../components/FilterBox.vue';
import EventRow from '../components/qualityAssurance/EventRow.vue';

export default {
    name: 'quality-assurance-page',
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
        };
    },
    created() {
        axios
            .get('/qualityAssurance/relevantInfo')
            .then(response => {
                this.allObjs = response.data.maps;
                this.userId = response.data.userId;
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
        updateEvent(event) {
            const i = this.allObjs.findIndex(e => e.id == event.id);
            this.allObjs[i] = event;
            this.filter();
        },
    },
};
</script>

<style>
</style>
