<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box 
                :filter-mode.sync="filterMode" 
                :filter-value.sync="filterValue"
                :placeholder="'content...'"
            >
                <button v-if="isLeader" class="btn btn-sm btn-nat ml-2" data-toggle="modal" data-target="#addRcDiscussion">
                    Submit RC thread for vote
                </button>
            </filter-box>
            
            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <rc-discussion-card
                            v-for="rcDiscussion in pageObjs"
                            :key="rcDiscussion.id"
                            :rc-discussion="rcDiscussion"
                            :user-id="userId"
                            @update:selectedRcDiscussion="selectedRcDiscussion = $event"
                        />
                    </transition-group>
                </div>
            </section>
        </div>
        <rc-discussion-info
            :rc-discussion="selectedRcDiscussion"
            :user-id="userId"
            :user-modes="userModes"
            :is-leader="isLeader"
            @update-rc-discussion="updateRcDiscussion($event)"
        />
        <submit-rc-discussion @submit-rc-discussion="SubmitRcDiscussion($event)" />
    </div>
</template>

<script>
import RcDiscussionCard from '../components/rcDiscussion/RcDiscussionCard.vue';
import RcDiscussionInfo from '../components/rcDiscussion/RcDiscussionInfo.vue';
import SubmitRcDiscussion from '../components/rcDiscussion/SubmitRcDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';

export default {
    name: 'RcPage',
    components: {
        RcDiscussionCard,
        RcDiscussionInfo,
        SubmitRcDiscussion,
        FilterBox,
    },
    mixins: [pagination, filters],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            userId: null,
            userModes: null,
            isLeader: false,
            isSpectator: false,
            selectedRcDiscussion: null,
        };
    },
    created() {
        axios
            .get('/rcVote/relevantInfo')
            .then(response => {
                this.allObjs = response.data.rcDiscussions;
                this.userId = response.data.userId;
                this.userModes = response.data.userModes;
                this.isSpectator = response.data.isSpectator;
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
            axios.get('/rcVote/relevantInfo').then(response => {
                this.allObjs = response.data.rcDiscussions;
                if (this.isFiltered) {
                    this.filter();
                }
            });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext: function(v) {
            if(v.title.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        SubmitRcDiscussion: function(v) {
            this.allObjs.unshift(v);
            this.filter();
        },
        updateRcDiscussion: function(rc) {
            const i = this.allObjs.findIndex(rcDiscussion => rcDiscussion.id == rc.id);
            this.allObjs[i] = rc;
            this.selectedRcDiscussion = rc;
            this.filter();
        },
    },
};
</script>

<style>
</style>
