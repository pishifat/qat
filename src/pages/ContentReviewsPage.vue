<template>
    <div class="row">
        <div class="col-md-12">
            <explicit-content-gate
                v-if="!loggedInUser.showExplicitContent && !tempShowExplicitContent"
                @proceed="toggleShowExplicitContent"
            />
            <template v-else>
            <filter-box
                :placeholder="'enter to search content reviews...'"
                store-module="contentReviews"
            >
                <div class="ms-1 mt-2">
                    <button
                        v-if="loggedInUser.hasBasicAccess"
                        class="btn w-100 btn-primary my-1"
                        data-bs-toggle="modal"
                        data-bs-target="#addDiscussion"
                    >
                        Submit content for review
                    </button>
                </div>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Active Content Reviews
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
                    Concluded Content Reviews
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
                    <pagination-nav store-module="contentReviews" />
                </template>
            </section>

            <submit-discussion
                :is-content-review="true"
                store-module="contentReviews"
            />
            <toast-messages />
            </template>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import contentReviewsModule from '../store/contentReviews';
import ToastMessages from '../components/ToastMessages.vue';
import DiscussionCard from '../components/discussion/DiscussionCard.vue';
import SubmitDiscussion from '../components/discussion/SubmitDiscussion.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';
import ExplicitContentGate from '../components/discussion/ExplicitContentGate.vue';

export default {
    name: 'ContentReviewsPage',
    components: {
        ToastMessages,
        DiscussionCard,
        SubmitDiscussion,
        FilterBox,
        PaginationNav,
        ExplicitContentGate,
    },
    data() {
        return {
            tempShowExplicitContent: false,
            archivedLoading: false,
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapState('contentReviews', ['archivedPagination']),
        ...mapGetters('contentReviews', [
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
        '$store.state.contentReviews.pageFilters.filters': {
            handler() {
                this.$store.commit('contentReviews/setArchivedPage', 1);
                this.fetchList(1, false);
            },
            deep: true,
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('contentReviews')) {
            this.$store.registerModule('contentReviews', contentReviewsModule);
        }
    },
    async created() {
        const hasListData = this.$store.hasModule('contentReviews')
            && this.$store.state.contentReviews.activeDiscussions.length;
        await this.fetchList(1, !hasListData);
    },
    methods: {
        async fetchList(archivedPage = 1, isInitialLoad = false) {
            const limit = 21;
            const filters = this.$store.state.contentReviews?.pageFilters?.filters || {};
            const params = new URLSearchParams({
                archivedPage: String(archivedPage),
                limit: String(limit),
            });
            if (filters.value) params.set('search', filters.value);
            const url = `/v2/content-reviews?${params.toString()}`;
            if (!isInitialLoad) this.archivedLoading = true;
            try {
                const data = isInitialLoad
                    ? await this.$http.initialRequest(url)
                    : await this.$http.executeGet(url);
                if (data && data.active !== undefined) {
                    this.$store.commit('contentReviews/setDiscussionListData', {
                        active: data.active,
                        archived: data.archived,
                    });
                }
            } finally {
                if (!isInitialLoad) this.archivedLoading = false;
            }
        },
        async toggleShowExplicitContent(e) {
            const data = await this.$http.executePost(
                `/users/${this.loggedInUser.id}/toggleShowExplicitContent`,
                {},
                e
            );

            if (data?.error) {
                return;
            }

            if (data?.user?.showExplicitContent !== undefined) {
                this.$store.state.loggedInUser.showExplicitContent = data.user.showExplicitContent;
            }

            this.tempShowExplicitContent = true;
        },
    },
};
</script>
