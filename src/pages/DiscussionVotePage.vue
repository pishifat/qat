<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search discussion...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="discussionVote"
            >
                <button
                    v-if="loggedInUser.hasBasicAccess"
                    class="btn btn-block btn-primary my-1"
                    data-toggle="modal"
                    data-target="#addDiscussion"
                >
                    {{
                        loggedInUser.isNat
                            ? 'Submit topic for vote'
                            : 'Submit content for review'
                    }}
                </button>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Active votes
                    <small v-if="activeDiscussionVotes"
                        >({{ activeDiscussionVotes.length }})</small
                    >
                </h2>

                <div
                    v-if="!activeDiscussionVotes.length"
                    class="ml-4 text-white-50"
                >
                    None...
                </div>

                <transition-group name="list" tag="div" class="row">
                    <discussion-card
                        v-for="discussion in activeDiscussionVotes"
                        :key="discussion.id"
                        :discussion="discussion"
                        :user-id="loggedInUser.userId"
                    />
                </transition-group>
            </section>

            <section class="card card-body">
                <h2>
                    Inactive votes
                    <small v-if="paginatedInactiveDiscussionVotes"
                        >({{ inactiveDiscussionVotes.length }})</small
                    >

                    <button
                        v-if="!reachedMax"
                        type="button"
                        class="btn btn-primary ml-2"
                        @click="showMore($event)"
                    >
                        Show more discussion votes
                    </button>
                    <button
                        v-if="!reachedMax"
                        type="button"
                        class="btn btn-secondary ml-2"
                        @click="showAll($event)"
                    >
                        Show all discussion votes
                    </button>
                </h2>

                <div
                    v-if="!paginatedInactiveDiscussionVotes.length"
                    class="ml-4 text-white-50"
                >
                    None...
                </div>

                <transition-group name="list" tag="div" class="row">
                    <discussion-card
                        v-for="discussion in paginatedInactiveDiscussionVotes"
                        :key="discussion.id"
                        :discussion="discussion"
                        :user-id="loggedInUser.userId"
                    />
                </transition-group>

                <pagination-nav store-module="discussionVote" />
            </section>
        </div>

        <discussion-info />

        <submit-discussion />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import discussionVoteModule from '../store/discussionVote';
import ToastMessages from '../components/ToastMessages.vue';
import DiscussionCard from '../components/discussion/DiscussionCard.vue';
import DiscussionInfo from '../components/discussion/DiscussionInfo.vue';
import SubmitDiscussion from '../components/discussion/SubmitDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';

export default {
    name: 'DiscussionVotePage',
    components: {
        ToastMessages,
        DiscussionCard,
        DiscussionInfo,
        SubmitDiscussion,
        FilterBox,
        PaginationNav,
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapState('discussionVote', ['discussionVotes']),
        ...mapGetters('discussionVote', [
            'activeDiscussionVotes',
            'inactiveDiscussionVotes',
            'paginatedInactiveDiscussionVotes',
        ]),
    },
    data() {
        return {
            skip: 20,
            limit: 20,
            reachedMax: false,
        };
    },
    watch: {
        inactiveDiscussionVotes(v) {
            this.$store.dispatch(
                'discussionVote/pagination/updateMaxPages',
                v.length
            );
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('discussionVote')) {
            this.$store.registerModule('discussionVote', discussionVoteModule);
        }
    },
    async created() {
        const id = this.$route.query.id;

        if (id) {
            const discussionVote = await this.$http.initialRequest(
                `/discussionVote/searchDiscussionVote/${id}`
            );

            if (discussionVote && !discussionVote.error) {
                this.$store.commit('discussionVote/setDiscussionVotes', [
                    discussionVote,
                ]);
                this.$store.commit(
                    'discussionVote/setSelectedDiscussionVoteId',
                    id
                );
                $('#extendedInfo').modal('show');
            }
        } else {
            const res = await this.$http.initialRequest(
                `/discussionVote/relevantInfo/${this.limit}`
            );

            if (res) {
                this.$store.commit(
                    'discussionVote/setDiscussionVotes',
                    res.discussions
                );
            }
        }
    },
    mounted() {
        setInterval(async () => {
            this.limit -= this.skip;
            const res = await this.$http.executeGet(
                `/discussionVote/relevantInfo/${this.limit}`
            );

            if (res) {
                this.$store.commit(
                    'discussionVote/setDiscussionVotes',
                    res.discussions
                );
            }
        }, 21600000);
    },
    methods: {
        async showMore(e) {
            this.limit += this.skip;

            const startDiscussionVotesCount = this.discussionVotes.length;

            const data = await this.$http.executeGet(
                `/discussionVote/relevantInfo/${this.limit}`,
                e
            );

            if (data.discussions) {
                this.$store.commit(
                    'discussionVote/setDiscussionVotes',
                    data.discussions
                );

                if (data.discussions.length == startDiscussionVotesCount) {
                    this.reachedMax = true;
                }
            }
        },
        async showAll(e) {
            const result = confirm(`Are you sure? This will take a while.`);
            if (result) {
                this.limit = 10000;
                this.reachedMax = true;
                await this.showMore(e);
            }
        },
    },
};
</script>
