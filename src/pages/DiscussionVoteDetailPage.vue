<template>
    <div class="row">
        <div class="col-md-12">
            <discussion-detail-header
                v-if="!loading && selectedDiscussion"
                back-path="/discussionvote"
                store-module="discussionVotes"
            />
            <discussion-detail-content
                v-if="!loading && selectedDiscussion"
                store-module="discussionVotes"
            />
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border" role="status" />
            </div>
            <div v-if="!loading && error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2" />
                {{ error }}
            </div>
        </div>
        <toast-messages />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import discussionVotesModule from '../store/discussionVotes';
import DiscussionDetailHeader from '../components/discussion/info/DiscussionDetailHeader.vue';
import DiscussionDetailContent from '../components/discussion/DiscussionDetailContent.vue';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'DiscussionVoteDetailPage',
    components: {
        DiscussionDetailHeader,
        DiscussionDetailContent,
        ToastMessages,
    },
    data() {
        return {
            loading: true,
            error: null,
        };
    },
    computed: {
        ...mapGetters('discussionVotes', ['selectedDiscussion']),
    },
    beforeCreate() {
        if (!this.$store.hasModule('discussionVotes')) {
            this.$store.registerModule('discussionVotes', discussionVotesModule);
        }
    },
    async mounted() {
        await this.loadDiscussion(this.$route.params.id);
    },
    watch: {
        '$route.params.id'(id) {
            this.loadDiscussion(id);
        },
    },
    methods: {
        async loadDiscussion(id) {
            this.loading = true;
            this.error = null;
            this.$store.commit('discussionVotes/setSelectedDiscussion', null);
            if (!id) {
                this.loading = false;
                this.error = 'Discussion vote not found';
                return;
            }
            this.$store.commit('discussionVotes/setSelectedDiscussionId', id);
            const discussion = await this.$http.executeGet(`/v2/discussion-votes/${id}`);
            this.loading = false;
            if (this.$http.isValid(discussion) && !discussion.error) {
                this.$store.commit('discussionVotes/setSelectedDiscussion', discussion);
            } else {
                this.error = discussion?.error || 'Discussion vote not found';
            }
        },
    },
    beforeUnmount() {
        this.$store.commit('discussionVotes/setSelectedDiscussionId', null);
        this.$store.commit('discussionVotes/setSelectedDiscussion', null);
    },
};
</script>
