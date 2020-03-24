<template>
    <div>
        <div class="mb-2">
            <div v-if="isNatOnly" class="form-group">
                <textarea
                    id="comment"
                    v-model="comment"
                    class="form-control dark-textarea"
                    style="white-space: pre-line;"
                    placeholder="Why you agree/disagree with the proposed change(s)..."
                    rows="2"
                />
            </div>
            <span class="mr-3 text-shadow" :class="error ? 'errors font-weight-bold text-uppercase' : ''">Vote:</span>
            <div class="form-check form-check-inline">
                <input
                    id="1"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="1"
                    :checked="vote == 1"
                >
                <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
            </div>
            <div v-if="neutralAllowed" class="form-check form-check-inline">
                <input
                    id="2"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="2"
                    :checked="vote == 2"
                >
                <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
            </div>
            <div class="form-check form-check-inline">
                <input
                    id="3"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="3"
                    :checked="vote == 3"
                >
                <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
            </div>
            <p v-if="!isNatOnly" class="small ml-2">
                Only NAT leaders can see your vote.
                <span v-if="discussionLink">
                    If you have any feedback to improve the proposal, post on <a :href="discussionLink" target="_blank">the thread</a>.
                </span>
            </p>
            <button class="btn btn-sm btn-nat float-right" @click="submitMediation($event)">
                Submit Vote
            </button>
        </div>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'MediatorOptions',
    mixins: [ postData ],
    props: {
        discussionId: String,
        discussionLink: String,
        mediations: Array,
        isNatOnly: Boolean,
        neutralAllowed: Boolean,
        userId: String,
    },
    data() {
        return {
            vote: null,
            comment: null,
            mediationId: null,
            error: false,
        };
    },
    watch: {
        mediations() {
            this.vote = null;
            this.comment = null;
            this.mediationId = null;
            this.error = false;

            if (this.mediations.length) {
                for (let i = 0; i < this.mediations.length; i++) {
                    let mediation = this.mediations[i];

                    if (mediation.mediator.id == this.userId) {
                        if (mediation.vote) this.vote = mediation.vote;
                        if (mediation.comment) this.comment = mediation.comment;
                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
    },
    mounted() {
        if (this.mediations.length) {
            for (let i = 0; i < this.mediations.length; i++) {
                let mediation = this.mediations[i];

                if (mediation.mediator.id == this.userId) {
                    if (mediation.vote) this.vote = mediation.vote;
                    if (mediation.comment) this.comment = mediation.comment;
                    this.mediationId = mediation.id;
                    break;
                }
            }
        }
    },
    methods: {
        async submitMediation (e) {
            const vote = $('input[name=vote]:checked').val();

            if (!vote) {
                this.error = true;
            } else {
                const d = await this.executePost(
                    '/discussionVote/submitMediation/' + this.discussionId,
                    { mediationId: this.mediationId,
                        vote,
                        comment: this.comment,
                    }, e);

                if (d) {
                    if (d.error) {
                        this.error = true;
                    } else {
                        this.vote = vote;
                        this.$emit('update-discussion', d);
                    }
                }
            }
        },
    },
};
</script>