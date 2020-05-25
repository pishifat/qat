<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search discussion...'"
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
                    <h2>Active votes <small v-if="activeDiscussionVotes">({{ activeDiscussionVotes.length }})</small></h2>
                    <div v-if="!activeDiscussionVotes.length" class="ml-4 text-white-50">
                        None...
                    </div>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <discussion-card
                            v-for="discussion in activeDiscussionVotes"
                            :key="discussion.id"
                            :discussion="discussion"
                            :user-id="userId"
                            @update:selectedDiscussion="selectedDiscussion = $event"
                        />
                    </transition-group>
                </div>
            </section>

            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <h2>Inactive Votes <small v-if="paginatedInactiveDiscussionVotes">({{ inactiveDiscussionVotes.length }})</small></h2>
                    <div v-if="!paginatedInactiveDiscussionVotes.length" class="ml-4 text-white-50">
                        None...
                    </div>
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <discussion-card
                            v-for="discussion in paginatedInactiveDiscussionVotes"
                            :key="discussion.id"
                            :discussion="discussion"
                            :user-id="userId"
                            @update:selectedDiscussion="selectedDiscussion = $event"
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

        <discussion-info />

        <submit-discussion />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import DiscussionCard from '../components/discussion/DiscussionCard.vue';
import DiscussionInfo from '../components/discussion/DiscussionInfo.vue';
import SubmitDiscussion from '../components/discussion/SubmitDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'DiscussionVotePage',
    components: {
        ToastMessages,
        DiscussionCard,
        DiscussionInfo,
        SubmitDiscussion,
        FilterBox,
    },
    mixins: [postData],
    computed: {
        ...mapState([
            'userId',
            'userModes',
            'isNat',
            'pagination',
        ]),
        ...mapGetters([
            'allDiscussionVotes',
            'activeDiscussionVotes',
            'inactiveDiscussionVotes',
            'paginatedInactiveDiscussionVotes',
        ]),
    },
    watch: {
        paginatedInactiveDiscussionVotes () {
            this.$store.dispatch('updatePaginationMaxPages');
        },
    },
    async created() {
        const res = await this.executeGet('/discussionVote/relevantInfo');

        if (res) {
            this.$store.commit('setDiscussionVotes', res.discussions);
            this.$store.commit('setUserId', res.userId);
            this.$store.commit('setUserModes', res.userModes);
            this.$store.commit('setIsNat', res.isNat);

            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('id') && params.get('id').length) {
                const i = this.allDiscussionVotes.findIndex(a => a.id == params.get('id'));

                if (i >= 0) {
                    this.$store.commit('setSelectedDiscussionVoteId', params.get('id'));
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
                this.$store.commit('setDiscussionVotes', res.discussions);
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

<style>
</style>
