<template>
    <div class="modal-header bg-primary">
        <h5 class="modal-title">
            <a
                v-if="selectedDiscussionVote.discussionLink"
                :href="selectedDiscussionVote.discussionLink"
                @click.prevent="confirmAndOpen(selectedDiscussionVote.discussionLink)"
            >
                {{ selectedDiscussionVote.title }}
            </a>

            <span v-else>{{ selectedDiscussionVote.title }}</span>

            <mode-display
                :modes="selectedDiscussionVote.mode"
                :show-all="true"
            />
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeDisplay from '../../ModeDisplay.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
    },
    computed: mapGetters('discussionVote', [
        'selectedDiscussionVote',
    ]),
    methods: {
        confirmAndOpen(url) {
            if (confirm(`This will redirect you to another webpage or download a file. This is user-submitted content, so if you don't trust the url, don't proceed.\n\n${url}`)) {
                window.location.href = url;
            }
        },
    },
};
</script>