<template>
    <div class="modal-header bg-primary">
        <h5 class="modal-title">
            <a
                v-if="selectedDiscussionVote.discussionLink"
                :href="selectedDiscussionVote.discussionLink"
                target="_blank"
            >
                {{ selectedDiscussionVote.title }}
            </a>

            <span v-else>{{ selectedDiscussionVote.title }}</span>

            <mode-display
                :modes="selectedDiscussionVote.mode"
                :show-all="true"
            />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
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
};
</script>