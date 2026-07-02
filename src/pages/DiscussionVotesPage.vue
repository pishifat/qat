<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search discussion votes...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="discussionVotes"
            >
                <div class="ms-1 mt-2">
                    <button
                        v-if="loggedInUser.isNat"
                        class="btn w-100 btn-primary my-1"
                        data-bs-toggle="modal"
                        data-bs-target="#addDiscussion"
                    >
                        Submit topic for vote/discussion
                    </button>
                </div>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Active Discussion Votes
                    <small v-if="activeDiscussionsList.length">({{ activeDiscussionsList.length }})</small>
                </h2>
                <div v-if="!activeDiscussionsList.length" class="ms-4 text-white-50">
                    None...
                </div>
                <transition-group name="list" tag="div" class="row">
                    <discussion-card
                        v-for="discussion in activeDiscussionsList"
                        :key="discussion.id"
                        :discussion="discussion"
                    />
                </transition-group>
            </section>

            <section class="card card-body">
                <h2>
                    Concluded Discussion Votes
                    <small v-if="archivedPagination.totalCount">({{ archivedPagination.totalCount }})</small>
                </h2>
                <div v-if="archivedLoading" class="text-center pt-3">
                    <div class="spinner-border" role="status" style="height: 1.62rem; width: 1.62rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <template v-else>
                    <div v-if="!archivedDiscussionsList.length" class="ms-4 text-white-50">
                        None...
                    </div>
                    <transition-group name="list" tag="div" class="row">
                        <discussion-card
                            v-for="discussion in archivedDiscussionsList"
                            :key="discussion.id"
                            :discussion="discussion"
                        />
                    </transition-group>
                    <pagination-nav store-module="discussionVotes" />
                </template>
            </section>

            <submit-discussion
                :is-content-review="false"
                store-module="discussionVotes"
            />
            <toast-messages />
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import discussionVotesModule from '../store/discussionVotes';
import ToastMessages from '../components/ToastMessages.vue';
import DiscussionCard from '../components/discussion/DiscussionCard.vue';
import SubmitDiscussion from '../components/discussion/SubmitDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';

export default {
    name: 'DiscussionVotesPage',
    components: {
        ToastMessages,
        DiscussionCard,
        SubmitDiscussion,
        FilterBox,
        PaginationNav,
    },
    data() {
        return {
            archivedLoading: false,
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapState('discussionVotes', ['archivedPagination']),
        ...mapGetters('discussionVotes', [
            'activeDiscussionsList',
            'archivedDiscussionsList',
        ]),
    },
    watch: {
        'archivedPagination.page': {
            handler(page, oldPage) {
                if (page > 0 && oldPage !== undefined) this.fetchList(page);
            },
        },
        '$store.state.discussionVotes.pageFilters.filters': {
            handler() {
                this.$store.commit('discussionVotes/setArchivedPage', 1);
                this.fetchList(1, false);
            },
            deep: true,
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('discussionVotes')) {
            this.$store.registerModule('discussionVotes', discussionVotesModule);
        }
    },
    async created() {
        const hasListData = this.$store.hasModule('discussionVotes')
            && this.$store.state.discussionVotes.activeDiscussions.length;
        await this.fetchList(1, !hasListData);
    },
    methods: {
        async fetchList(archivedPage = 1, isInitialLoad = false) {
            const limit = 21;
            const filters = this.$store.state.discussionVotes?.pageFilters?.filters || {};
            const params = new URLSearchParams({
                archivedPage: String(archivedPage),
                limit: String(limit),
            });
            if (filters.mode) params.set('mode', filters.mode);
            if (filters.value) params.set('search', filters.value);
            const url = `/v2/discussion-votes?${params.toString()}`;
            if (!isInitialLoad) this.archivedLoading = true;
            try {
                const data = isInitialLoad
                    ? await this.$http.initialRequest(url)
                    : await this.$http.executeGet(url);
                if (data && data.active !== undefined) {
                    this.$store.commit('discussionVotes/setDiscussionListData', {
                        active: data.active,
                        archived: data.archived,
                    });
                }
            } finally {
                if (!isInitialLoad) this.archivedLoading = false;
            }
        },
    },
};
</script>
