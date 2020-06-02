<template>
    <div class="modal-header bg-nat">
        <h5 class="modal-title">
            <a
                v-if="selectedDiscussionVote.discussionLink.length"
                :href="selectedDiscussionVote.discussionLink"
                target="_blank"
            >
                {{ selectedDiscussionVote.title }}
            </a>

            <span v-else>{{ selectedDiscussionVote.title }}</span>

            <i v-if="selectedDiscussionVote.mode.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-if="selectedDiscussionVote.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-if="selectedDiscussionVote.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-if="selectedDiscussionVote.mode.indexOf('mania') >= 0" class="fas fa-stream" />
            <span v-if="selectedDiscussionVote.mode.indexOf('all') >= 0">
                <i class="far fa-circle" />
                <i class="fas fa-drum" />
                <i class="fas fa-apple-alt" />
                <i class="fas fa-stream" />
            </span>
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
    name: 'ModalHeader',
    computed: {
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
    },
};
</script>