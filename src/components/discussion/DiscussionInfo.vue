<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="discussion" class="modal-content">
                <modal-header
                    :discussion-link="discussion.discussionLink"
                    :title="discussion.title"
                    :mode="discussion.mode"
                />
                <div class="modal-body" style="overflow: hidden">
                    <div class="container text-shadow">
                        <discussion-context
                            :discussion-id="discussion.id"
                            :discussion-link="discussion.discussionLink"
                            :is-creator="discussion.creator == userId"
                            :title="discussion.title"
                            :short-reason="discussion.shortReason"
                            @update-discussion="$emit('update-discussion', $event)"
                        />
                        <votes-public-active
                            v-if="discussion.isActive && !isLeader"
                            :mediations="discussion.mediations"
                        />
                        <votes-leader-active
                            v-else-if="!discussion.isNatOnly && isLeader"
                            :agree-mediations="agreeMediations"
                            :neutral-mediations="neutralMediations"
                            :disagree-mediations="disagreeMediations"
                        />
                        <votes-nat-only-active
                            v-else-if="discussion.isActive && discussion.isNatOnly"
                            :mediations="discussion.mediations"
                        />
                        <votes-inactive
                            v-else-if="!discussion.isActive"
                            :is-nat-only-or-leader="discussion.isNatOnly || isLeader"
                            :agree-mediations="agreeMediations"
                            :neutral-mediations="neutralMediations"
                            :disagree-mediations="disagreeMediations"
                        />
                        <button v-if="discussion.isActive && isLeader" class="btn btn-sm btn-nat mt-3" @click="concludeMediation($event)">
                            Conclude Vote
                        </button>
                        <hr>
                        <mediator-options
                            v-if="discussion.isActive && (userModes.indexOf(discussion.mode) >= 0 || discussion.mode == 'all' || isLeader)"
                            :discussion-id="discussion.id"
                            :is-nat-only="discussion.isNatOnly"
                            :mediations="discussion.mediations"
                            :user-id="userId"
                            @update-discussion="$emit('update-discussion', $event)"
                        />
                        <p v-else-if="discussion.isActive" class="small">
                            Because you're not proficient in this proposal's game mode, you're not able to vote :(
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import ModalHeader from './info/ModalHeader.vue';
import DiscussionContext from './info/DiscussionContext.vue';
import VotesPublicActive from './info/votes/VotesPublicActive.vue';
import VotesLeaderActive from './info/votes/VotesLeaderActive.vue';
import VotesNatOnlyActive from './info/votes/VotesNatOnlyActive.vue';
import VotesInactive from './info/votes/VotesInactive.vue';
import MediatorOptions from './info/MediatorOptions.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        ModalHeader,
        DiscussionContext,
        VotesPublicActive,
        VotesLeaderActive,
        VotesNatOnlyActive,
        VotesInactive,
        MediatorOptions,
    },
    mixins: [ postData, filterLinks ],
    props: {
        discussion: Object,
        userId: String,
        userModes: Array,
        isLeader: Boolean,
        isNat: Boolean,
    },
    computed: {
        agreeMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 2);
        },
        disagreeMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 3);
        },
    },
    methods: {
        async concludeMediation (e) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure?`);
            if(result){
                const d = await this.executePost(
                    '/discussionVote/concludeMediation/' + this.discussion.id, e);
                if (d) {
                    if (d.error) {
                        this.info = d.error;
                    } else {
                        this.$emit('update-discussion', d);
                        this.confirm = 'Discussion concluded!';
                    }
                }
            }
        },
    },
};
</script>

<style>
    .bg-active {
        background-color: var(--available);
    }

    .bg-inactive {
        background-color: var(--withdrawn);
    }
    
</style>
