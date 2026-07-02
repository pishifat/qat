<template>
    <section class="card card-body position-relative">
        <div v-if="selectedDiscussion" class="d-flex flex-wrap align-items-center gap-2">
            <router-link :to="backPath" class="text-decoration-none" @click="onBack">
                <i class="fas fa-arrow-left" />
                Back
            </router-link>
            <span class="text-muted">|</span>
            <a
                v-if="safeDiscussionLink"
                :href="safeDiscussionLink"
                @click.prevent="confirmAndOpen(selectedDiscussion.discussionLink)"
            >
                <b>{{ selectedDiscussion.title }}</b>
            </a>
            <b v-else>{{ selectedDiscussion.title }}</b>
            <mode-display
                :modes="selectedDiscussion.mode"
                :show-all="true"
            />
            <span
                class="badge rounded-pill ms-2"
                :class="selectedDiscussion.isActive ? 'bg-success' : 'bg-primary'"
            >
                {{ selectedDiscussion.isActive ? 'Active' : 'Concluded' }}
            </span>
        </div>
    </section>
</template>

<script>
import discussionStoreMixin from '../../../mixins/discussionStore';
import ModeDisplay from '../../ModeDisplay.vue';

export default {
    name: 'DiscussionDetailHeader',
    components: {
        ModeDisplay,
    },
    mixins: [discussionStoreMixin],
    props: {
        backPath: {
            type: String,
            required: true,
        },
    },
    computed: {
        safeDiscussionLink() {
            return this.sanitizeUrl(this.selectedDiscussion?.discussionLink);
        },
    },
    methods: {
        onBack() {
            this.$store.commit(`${this.storeModule}/setSelectedDiscussion`, null);
            this.$store.commit(`${this.storeModule}/setSelectedDiscussionId`, null);
        },
        confirmAndOpen(url) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) {
                alert('Invalid or unsafe URL.');
                return;
            }
            if (confirm(`This will redirect you to another webpage or download a file. This is user-submitted content, so if you don't trust the url, don't proceed.\n\n${safeUrl}`)) {
                window.location.href = safeUrl;
            }
        },
    },
};
</script>
