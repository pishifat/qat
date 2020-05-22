<template>
    <div>
        <div class="mb-2">
            <div v-if="selectedDiscussionVote.isNatOnly" class="form-group">
                <textarea
                    id="comment"
                    v-model="comment"
                    class="form-control dark-textarea"
                    style="white-space: pre-line;"
                    placeholder="Why you agree/disagree with the proposed change(s)..."
                    rows="2"
                />
            </div>
            <div class="d-flex justify-content-end mb-2">
                <div class="form-check form-check-inline">
                    <input
                        id="1"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="1"
                    >
                    <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
                </div>
                <div v-if="selectedDiscussionVote.neutralAllowed" class="form-check form-check-inline">
                    <input
                        id="2"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="2"
                    >
                    <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                </div>
                <div class="form-check form-check-inline">
                    <input
                        id="3"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="3"
                    >
                    <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
                </div>
            </div>
            <p v-if="!selectedDiscussionVote.isNatOnly && selectedDiscussionVote.discussionLink" class="small ml-2">
                If you have any feedback to improve the proposal, post on <a :href="selectedDiscussionVote.discussionLink" target="_blank">the thread</a>.
            </p>
            <div class="d-flex justify-content-end">
                <button class="btn btn-sm btn-nat" @click="submitMediation($event)">
                    Submit vote
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'MediatorOptions',
    mixins: [ postData ],
    data() {
        return {
            vote: null,
            comment: null,
            mediationId: null,
        };
    },
    computed: {
        ...mapState([
            'userId',
        ]),
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
    },
    watch: {
        selectedDiscussionVote() {
            this.findUserMediation();
        },
    },
    mounted() {
        this.findUserMediation();
    },
    methods: {
        findUserMediation() {
            this.vote = null;
            this.comment = null;
            this.mediationId = null;

            if (this.selectedDiscussionVote.mediations.length) {
                for (let i = 0; i < this.selectedDiscussionVote.mediations.length; i++) {
                    let mediation = this.selectedDiscussionVote.mediations[i];

                    if (mediation.mediator.id == this.userId) {
                        if (mediation.vote) this.vote = mediation.vote;
                        if (mediation.comment) this.comment = mediation.comment;
                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
        async submitMediation (e) {
            const discussionVote = await this.executePost(
                '/discussionVote/submitMediation/' + this.selectedDiscussionVote.id, {
                    mediationId: this.mediationId,
                    vote: this.vote,
                    comment: this.comment,
                }, e);

            if (discussionVote && !discussionVote.error) {
                this.$store.dispatch('updateDiscussionVote', discussionVote);
                this.$store.dispatch('updateToastMessages', {
                    message: `Submitted vote`,
                    type: 'success',
                });
            }
        },
    },
};
</script>