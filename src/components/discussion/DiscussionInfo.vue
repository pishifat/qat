<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussionVote" class="modal-content">
                <modal-header />
                <div class="modal-body" style="overflow: hidden">
                    <div class="container text-shadow">
                        <discussion-context />

                        <votes-public-active
                            v-if="selectedDiscussionVote.isActive && !selectedDiscussionVote.isNatOnly"
                        />
                        <votes-nat-only-active
                            v-else-if="selectedDiscussionVote.isActive && selectedDiscussionVote.isNatOnly"
                        />
                        <votes-inactive
                            v-else-if="!selectedDiscussionVote.isActive"
                        />

                        <button v-if="selectedDiscussionVote.isActive && isNat" class="btn btn-sm btn-nat mt-3" @click="concludeMediation($event)">
                            Conclude Vote
                        </button>

                        <div v-if="selectedDiscussionVote.isActive">
                            <hr>

                            <!-- only show voting options for users of specified mode -->
                            <mediator-options
                                v-if="userModes.indexOf(selectedDiscussionVote.mode) >= 0 || selectedDiscussionVote.mode == 'all'"
                            />
                            <p v-else class="small">
                                Because you're not proficient in this proposal's game mode, you're not able to vote :(
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../mixins/postData.js';
import ModalHeader from './info/ModalHeader.vue';
import DiscussionContext from './info/DiscussionContext.vue';
import VotesPublicActive from './info/votes/VotesPublicActive.vue';
import VotesNatOnlyActive from './info/votes/VotesNatOnlyActive.vue';
import VotesInactive from './info/votes/VotesInactive.vue';
import MediatorOptions from './info/MediatorOptions.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        ModalHeader,
        DiscussionContext,
        VotesPublicActive,
        VotesNatOnlyActive,
        VotesInactive,
        MediatorOptions,
    },
    mixins: [ postData ],
    computed: {
        ...mapState([
            'userId',
            'userModes',
            'isNat',
        ]),
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
    },
    watch: {
        selectedDiscussionVote() {
            history.pushState(null, 'Discussion Vote', `/discussionvote?id=${this.selectedDiscussionVote.id}`);
        },
    },
    methods: {
        async concludeMediation (e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const discussionVote = await this.executePost(
                    '/discussionVote/concludeMediation/' + this.selectedDiscussionVote.id, e);

                if (discussionVote && !discussionVote.error) {
                    this.$store.dispatch('updateDiscussionVote', discussionVote);
                    this.$store.dispatch('updateToastMessages', {
                        message: `concluded vote`,
                        type: 'info',
                    });
                }
            }
        },
    },
};
</script>
