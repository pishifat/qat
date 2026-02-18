<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectDiscussion()">
        <div
            class="card card-individual"
            :class="['border-' + findRelevantMediation(), discussion.isNatOnly ? 'nat-vote' : '']"
            data-bs-toggle="modal"
            data-bs-target="#extendedInfo"
            :data-discussion="discussion.id"
        >
            <img v-if="isImage" :src="discussion.discussionLink" class="card-thumb">
            <div class="card-body">
                <div class="wrap-text">
                    <a
                        v-if="discussion.discussionLink"
                        :href="discussion.discussionLink"
                        target="_blank"
                        @click.stop
                    ><b>{{ discussion.title }}</b></a>
                    <span v-else><b>{{ discussion.title }}</b></span>
                </div>
                <div v-if="discussion.isContentReview && !discussion.isActive" class="small">
                    Consensus:
                    <span :class="discussion.isAcceptable == true ? 'text-success' : discussion.isAcceptable == false ? 'text-danger' : 'text-secondary'">
                        {{ discussion.isAcceptable == true ? 'Pass' : discussion.isAcceptable == false ? 'Fail' : 'Unknown' }}
                    </span>
                </div>
                <div class="card-status" :class="discussion.isActive ? 'status-bar-active' : 'status-bar-inactive'" />

                <div>
                    <span class="small float-start">{{ toStandardDate(discussion.createdAt) }}</span>

                    <add-votes
                        v-if="!discussion.isActive || loggedInUser.isNatLeader"
                        class="ms-2"
                        :inputs="discussion.mediations"
                    />

                    <mode-display
                        class="float-end"
                        :modes="discussion.mode"
                        :show-all="true"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ModeDisplay from '../ModeDisplay.vue';
import AddVotes from '../evaluations/card/AddVotes.vue';

export default {
    name: 'DiscussionCard',
    components: {
        ModeDisplay,
        AddVotes,
    },
    props: {
        discussion: {
            type: Object,
            required: true,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {boolean} */
        isImage() {
            if (this.discussion && this.discussion.discussionLink) {
                return (this.discussion.discussionLink.match(/\.(jpeg|jpg|gif|png)$/) != null);
            } else {
                return null;
            }
        },
    },
    methods: {
        selectDiscussion() {
            this.$store.commit('discussionVote/setSelectedDiscussionVoteId', this.discussion.id);

            if (this.$route.query.id !== this.discussion.id) {
                this.$router.replace(`/discussionvote?id=${this.discussion.id}`);
            }
        },
        findRelevantMediation() {
            let vote;
            this.discussion.mediations.forEach(m => {
                if (m.mediator && m.mediator.id == this.loggedInUser.id) {
                    if (m.vote == 1) {
                        vote = 'pass';
                    } else if (m.vote == 2) {
                        vote = 'neutral';
                    } else {
                        vote = 'fail';
                    }
                }
            });

            return vote;
        },
    },
};
</script>

<style scoped>

.card-thumb {
    position: absolute;
    top: 8px;
    left: calc(100% - 67px);
    max-width: 60px;
    max-height: 40px;
    object-fit: cover;
    border-radius: 10%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--bs-gray-800);
}

.status-bar-active {
    background: radial-gradient(#fff, transparent 70%);
}

.status-bar-inactive {
    background: radial-gradient(var(--bs-gray-600), transparent 70%);
}

.nat-vote {
    background-color: rgb(95, 60, 60) !important
}

</style>
