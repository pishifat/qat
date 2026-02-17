<template>
    <modal-dialog id="extendedInfo">
        <template v-if="selectedDiscussionVote" #header>
            <modal-header />
        </template>

        <div v-if="selectedDiscussionVote" class="container">
            <discussion-context />

            <votes-active
                v-if="selectedDiscussionVote.isActive && !loggedInUser.isNatLeader"
            />
            <votes-inactive v-else />

            <button v-if="selectedDiscussionVote.isActive && loggedInUser.hasFullReadAccess" class="btn btn-sm btn-danger btn-block mt-3" @click="concludeMediation($event)">
                Conclude Vote
            </button>

            <debug-view-document
                v-if="loggedInUser.isAdmin"
                :document="selectedDiscussionVote"
            />

            <div v-if="selectedDiscussionVote.isActive && loggedInUser.hasBasicAccess">
                <hr>

                <!-- only show voting options for users of specified mode -->
                <mediator-options
                    v-if="loggedInUser.modes.includes(selectedDiscussionVote.mode) || selectedDiscussionVote.mode == 'all' || loggedInUser.modes.includes('none')"
                    :is-content-review="selectedDiscussionVote.isContentReview"
                />
                <p v-else class="small">
                    Because you're not proficient in this proposal's game mode, you're not able to vote :(
                </p>
            </div>
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import DiscussionContext from './info/DiscussionContext.vue';
import VotesActive from './info/votes/VotesActive.vue';
import VotesInactive from './info/votes/VotesInactive.vue';
import MediatorOptions from './info/MediatorOptions.vue';
import ModalDialog from '../ModalDialog.vue';
import DebugViewDocument from '../DebugViewDocument.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        ModalHeader,
        DiscussionContext,
        VotesActive,
        VotesInactive,
        MediatorOptions,
        ModalDialog,
        DebugViewDocument,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
    },
    methods: {
        async concludeMediation (e) {
            const result = confirm(`Are you sure? This will end voting for everyone.`);

            if (result) {
                const result2 = confirm(`ARE YOU REALLY SURE? THIS IS NOT THE VOTE BUTTON. DON'T BE STUPID.`);

                if (result2) {
                    const data = await this.$http.executePost(
                        '/discussionVote/concludeMediation/' + this.selectedDiscussionVote.id, e);

                    if (this.$http.isValid(data)) {
                        this.$store.commit('discussionVote/updateDiscussionVote', data.discussion);
                    }
                }

            }
        },
    },
};
</script>
