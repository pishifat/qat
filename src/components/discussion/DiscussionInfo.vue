<template>
    <modal-dialog id="extendedInfo">
        <template v-if="selectedDiscussionVote" #header>
            <modal-header />
        </template>

        <div v-if="selectedDiscussionVote" class="container">
            <discussion-context />

            <votes-active
                v-if="selectedDiscussionVote.isActive"
            />
            <votes-inactive
                v-else-if="!selectedDiscussionVote.isActive"
            />

            <button v-if="selectedDiscussionVote.isActive && loggedInUser.hasFullReadAccess" class="btn btn-sm btn-danger btn-block mt-3" @click="concludeMediation($event)">
                Conclude Vote
            </button>

            <div v-if="selectedDiscussionVote.isActive">
                <hr>

                <!-- only show voting options for users of specified mode -->
                <mediator-options
                    v-if="loggedInUser.modes.includes(selectedDiscussionVote.mode) || selectedDiscussionVote.mode == 'all'"
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
import postData from '../../mixins/postData.js';
import ModalHeader from './info/ModalHeader.vue';
import DiscussionContext from './info/DiscussionContext.vue';
import VotesActive from './info/votes/VotesActive.vue';
import VotesInactive from './info/votes/VotesInactive.vue';
import MediatorOptions from './info/MediatorOptions.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        ModalHeader,
        DiscussionContext,
        VotesActive,
        VotesInactive,
        MediatorOptions,
        ModalDialog,
    },
    mixins: [ postData ],
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
                    const discussionVote = await this.executePost(
                        '/discussionVote/concludeMediation/' + this.selectedDiscussionVote.id, e);

                    if (discussionVote && !discussionVote.error) {
                        this.$store.commit('discussionVote/updateDiscussionVote', discussionVote);
                        this.$store.dispatch('updateToastMessages', {
                            message: `Concluded vote`,
                            type: 'success',
                        });
                    }
                }

            }
        },
    },
};
</script>
