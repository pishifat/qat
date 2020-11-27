<template>
    <div>
        <div class="mb-2">
            <textarea
                v-if="selectedDiscussionVote.reasonAllowed"
                id="comment"
                v-model="comment"
                class="form-control"
                placeholder="Why you agree/disagree with the proposed change(s)..."
                rows="3"
            />

            <div class="form-inline justify-content-end mb-2 my-1">
                <div class="form-check form-check-inline">
                    <input
                        id="1"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="1"
                    >
                    <label class="form-check-label text-pass" for="1">Agree</label>
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
                    <label class="form-check-label text-neutral" for="2">Neutral</label>
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
                    <label class="form-check-label text-fail" for="3">Disagree</label>
                </div>
            </div>

            <div class="d-flex justify-content-end">
                <button class="btn btn-sm btn-primary" @click="submitMediation($event)">
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
            'loggedInUser',
        ]),
        ...mapGetters('discussionVote', [
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
                for (const mediation of this.selectedDiscussionVote.mediations) {
                    if (mediation.mediator && mediation.mediator.id == this.loggedInUser.id) {
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
                    vote: this.vote,
                    comment: this.comment,
                }, e);

            if (discussionVote && !discussionVote.error) {
                this.$store.commit('discussionVote/updateDiscussionVote', discussionVote);
                this.$store.dispatch('updateToastMessages', {
                    message: `Submitted vote`,
                    type: 'success',
                });
            }
        },
    },
};
</script>