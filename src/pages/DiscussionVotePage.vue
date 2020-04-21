<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :filter-mode.sync="filterMode"
                :filter-value.sync="filterValue"
                :placeholder="'content...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <button
                    v-if="isNat"
                    class="btn btn-sm btn-nat ml-2"
                    data-toggle="modal"
                    data-target="#addDiscussion"
                >
                    Submit topic for vote
                </button>
            </filter-box>

            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <discussion-card
                            v-for="discussion in pageObjs"
                            :key="discussion.id"
                            :discussion="discussion"
                            :user-id="userId"
                            @update:selectedDiscussion="selectedDiscussion = $event"
                        />
                    </transition-group>
                </div>
            </section>
        </div>
        <discussion-info
            :discussion="selectedDiscussion"
            :user-id="userId"
            :user-modes="userModes"
            :is-pishifat="isPishifat"
            :is-nat="isNat"
            @update-discussion="updateDiscussion($event)"
        />
        <submit-discussion @submit-discussion="SubmitDiscussion($event)" />
    </div>
</template>

<script>
import DiscussionCard from '../components/discussion/DiscussionCard.vue';
import DiscussionInfo from '../components/discussion/DiscussionInfo.vue';
import SubmitDiscussion from '../components/discussion/SubmitDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'DiscussionVotePage',
    components: {
        DiscussionCard,
        DiscussionInfo,
        SubmitDiscussion,
        FilterBox,
    },
    mixins: [pagination, filters, postData],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            userId: null,
            userModes: null,
            isPishifat: false,
            isNat: false,
            selectedDiscussion: null,
        };
    },
    async created() {
        const res = await this.executeGet('/discussionVote/relevantInfo');

        if (res) {
            this.allObjs = res.discussions;
            this.userId = res.userId;
            this.userModes = res.userModes;
            this.isPishifat = res.isPishifat;
            this.isNat = res.isNat;
            this.limit = 24;
            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('id') && params.get('id').length) {
                const i = this.allObjs.findIndex(a => a.id == params.get('id'));

                if (i >= 0) {
                    this.selectedDiscussion = this.allObjs[i];
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
    mounted() {
        setInterval(async () => {
            const res = await this.executeGet('/discussionVote/relevantInfo');

            if (res) {
                this.allObjs = res.discussions;

                if (this.isFiltered) {
                    this.filter();
                }
            }
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(v) {
            if (v.title.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) {
                return true;
            }

            return false;
        },
        SubmitDiscussion(v) {
            this.allObjs.unshift(v);
            this.filter();
        },
        updateDiscussion(rc) {
            const i = this.allObjs.findIndex(discussion => discussion.id == rc.id);
            this.allObjs[i] = rc;
            this.selectedDiscussion = rc;
            this.filter();
        },
    },
};
</script>

<style>
</style>
