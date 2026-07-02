<template>
    <section v-if="selectedDiscussion" class="container card card-body">
        <discussion-context :store-module="storeModule" />

        <votes-active
            v-if="selectedDiscussion.isActive && !loggedInUser.isNatLeader"
            :store-module="storeModule"
        />
        <votes-inactive v-else :store-module="storeModule" />

        <button
            v-if="selectedDiscussion.isActive && loggedInUser.hasFullReadAccess"
            class="btn btn-sm btn-danger w-100 mt-3"
            @click="concludeMediation($event)"
        >
            Conclude Vote
        </button>

        <div v-if="selectedDiscussion.isActive && loggedInUser.hasBasicAccess">
            <mediator-options
                v-if="loggedInUser.modes.includes(selectedDiscussion.mode) || selectedDiscussion.mode == 'all' || loggedInUser.modes.includes('none')"
                :is-content-review="selectedDiscussion.isContentReview"
                :store-module="storeModule"
            >
                <hr>
            </mediator-options>
            <p v-else class="small">
                Because you're not proficient in this proposal's game mode, you're not able to vote :(
            </p>
        </div>

        <debug-view-document
            v-if="loggedInUser.isAdmin"
            :document="selectedDiscussion"
        />
    </section>
</template>

<script>
import { mapState } from 'vuex';
import discussionStoreMixin from '../../mixins/discussionStore';
import DiscussionContext from './info/DiscussionContext.vue';
import VotesActive from './info/votes/VotesActive.vue';
import VotesInactive from './info/votes/VotesInactive.vue';
import MediatorOptions from './info/MediatorOptions.vue';
import DebugViewDocument from '../DebugViewDocument.vue';

export default {
    name: 'DiscussionDetailContent',
    components: {
        DiscussionContext,
        VotesActive,
        VotesInactive,
        MediatorOptions,
        DebugViewDocument,
    },
    mixins: [discussionStoreMixin],
    computed: {
        ...mapState(['loggedInUser']),
    },
    methods: {
        async concludeMediation(e) {
            const result = confirm('Are you sure? This will end voting for everyone.');
            if (!result) return;

            const result2 = confirm('ARE YOU REALLY SURE? THIS IS NOT THE VOTE BUTTON. DON\'T BE STUPID.');
            if (!result2) return;

            const data = await this.$http.executePost(
                `/discussionVote/concludeMediation/${this.selectedDiscussion.id}`,
                e
            );

            if (this.$http.isValid(data)) {
                this.updateDiscussionInStore(data.discussion);
            }
        },
    },
};
</script>
