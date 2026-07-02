<template>
    <div class="row">
        <div class="col-md-12">
            <explicit-content-gate
                v-if="!canViewExplicitContent"
                @proceed="toggleShowExplicitContent"
            />
            <template v-else>
                <discussion-detail-header
                    v-if="!loading && selectedDiscussion"
                    back-path="/contentreview"
                    store-module="contentReviews"
                />
                <discussion-detail-content
                    v-if="!loading && selectedDiscussion"
                    store-module="contentReviews"
                />
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border" role="status" />
                </div>
                <div v-if="!loading && error" class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2" />
                    {{ error }}
                </div>
            </template>
        </div>
        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import contentReviewsModule from '../store/contentReviews';
import DiscussionDetailHeader from '../components/discussion/info/DiscussionDetailHeader.vue';
import DiscussionDetailContent from '../components/discussion/DiscussionDetailContent.vue';
import ExplicitContentGate from '../components/discussion/ExplicitContentGate.vue';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'ContentReviewDetailPage',
    components: {
        DiscussionDetailHeader,
        DiscussionDetailContent,
        ExplicitContentGate,
        ToastMessages,
    },
    data() {
        return {
            loading: false,
            error: null,
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('contentReviews', ['selectedDiscussion']),
        canViewExplicitContent() {
            return this.loggedInUser.showExplicitContent;
        },
    },
    watch: {
        '$route.params.id'(id) {
            if (this.canViewExplicitContent) {
                this.loadDiscussion(id);
            }
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('contentReviews')) {
            this.$store.registerModule('contentReviews', contentReviewsModule);
        }
    },
    async mounted() {
        if (this.canViewExplicitContent) {
            await this.loadDiscussion(this.$route.params.id);
        }
    },
    methods: {
        async toggleShowExplicitContent(e) {
            const data = await this.$http.executePost(
                `/users/${this.loggedInUser.id}/toggleShowExplicitContent`,
                {},
                e
            );

            if (data?.error) {
                return;
            }

            window.location.reload();
        },
        async loadDiscussion(id) {
            this.loading = true;
            this.error = null;
            this.$store.commit('contentReviews/setSelectedDiscussion', null);
            if (!id) {
                this.loading = false;
                this.error = 'Content review not found';
                return;
            }
            this.$store.commit('contentReviews/setSelectedDiscussionId', id);
            try {
                const discussion = await this.$http.executeGet(`/v2/content-reviews/${id}`);
                if (this.$http.isValid(discussion) && !discussion.error) {
                    this.$store.commit('contentReviews/setSelectedDiscussion', discussion);
                } else {
                    this.error = discussion?.error || 'Content review not found';
                }
            } finally {
                this.loading = false;
            }
        },
    },
    beforeUnmount() {
        this.$store.commit('contentReviews/setSelectedDiscussionId', null);
        this.$store.commit('contentReviews/setSelectedDiscussion', null);
    },
};
</script>
