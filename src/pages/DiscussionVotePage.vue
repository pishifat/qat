<template>
    <div v-if="!loggedInUser.showExplicitContent && !tempShowExplicitContent">
        <section class="card card-body">
            <div>
                This page may contain <b>explicit content</b>.
            </div>
            <div>
                If you would like to proceed, <a href="#" @click="toggleShowExplicitContent($event)">click here</a>.
            </div>
        </section>
    </div>
    <div v-else>
        <filter-box
            :placeholder="'enter to search discussion...'"
            :modes="['', 'osu', 'taiko', 'catch', 'mania']"
            store-module="discussionVote"
        >
            <div v-if="loggedInUser.hasBasicAccess" class="row">
                <div :class="loggedInUser.isNat ? 'col-sm-6' : 'col-sm-12'">
                    <button
                        class="btn btn-block btn-primary my-1"
                        data-toggle="modal"
                        data-target="#addDiscussion"
                        @click="isContentReview = true"
                    >
                        Submit content for review
                    </button>
                </div>
                <div v-if="loggedInUser.isNat" class="col-sm-6">
                    <button
                        class="btn btn-block btn-primary my-1"
                        data-toggle="modal"
                        data-target="#addDiscussion"
                        @click="isContentReview = false"
                    >
                        Submit topic for vote/discussion
                    </button>
                </div>
            </div>
        </filter-box>

        <section class="card card-body">
            <h2>
                Active votes
                <small v-if="activeDiscussionVotes">({{ activeDiscussionVotes.length }})</small>
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
                <small v-if="paginatedInactiveDiscussionVotes">
                    ({{ inactiveDiscussionVotes.length + (reachedMax ? '' : '+') }})
                </small>

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

        <discussion-info />

        <submit-discussion
            :is-content-review="isContentReview"
        />

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
            skip: 24,
            limit: 24,
            reachedMax: false,
            tempShowExplicitContent: false,
            isContentReview: true,
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

        await this.showMore(null, true);

        if (id) {
            const discussionVote = await this.$http.initialRequest(
                `/discussionVote/searchDiscussionVote/${id}`
            );

            const i = this.discussionVotes.findIndex((d) => d.id == id);

            if (i >= 0) {
                this.$store.commit(
                    'discussionVote/setSelectedDiscussionVoteId',
                    id
                );
                $('#extendedInfo').modal('show');
            } else {
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
        async showMore(e, firstLoad) {
            this.limit += this.skip;

            const startDiscussionVotesCount = this.discussionVotes.length;

            let data;

            if (firstLoad) {
                data = await this.$http.initialRequest(
                    `/discussionVote/relevantInfo/${this.limit}`
                );
            } else {
                data = await this.$http.executeGet(
                    `/discussionVote/relevantInfo/${this.limit}`,
                    e
                );
            }

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
        async toggleShowExplicitContent(e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/toggleShowExplicitContent`, {}, e);

            this.tempShowExplicitContent = true;
        },
    },
};
</script>
