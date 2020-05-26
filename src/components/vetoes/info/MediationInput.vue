<template>
    <div>
        <hr>
        <p class="text-shadow min-spacing">
            Reason for vote:
        </p>
        <p class="text-shadow small min-spacing px-4 mb-2">
            This comment will be displayed anonymously alongside the verdict post. If your response is deemed inappropriate, your vote will be marked as invalid.
        </p>
        <div class="form-group">
            <textarea
                id="comment"
                v-model="comment"
                class="form-control dark-textarea"
                style="white-space: pre-line;"
                placeholder="Why you agree/disagree with the veto..."
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
            <div class="form-check form-check-inline">
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
        <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-nat" @click="submitMediation($event)">
                Submit mediation
            </button>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData';

export default {
    name: 'MediationInput',
    mixins: [ postData ],
    data() {
        return {
            comment: null,
            vote: null,
            mediationId: null,
        };
    },
    computed: {
        ...mapState([
            'userId',
            'isUser',
        ]),
        ...mapGetters([
            'selectedVeto',
        ]),
    },
    watch: {
        selectedVeto() {
            this.findUserMediation();
        },
    },
    mounted() {
        this.findUserMediation();
    },
    methods: {
        findUserMediation() {
            if (!this.isUser) { // mediator info is hidden from normal users, so this function wouldn't work
                this.mediationId = null;
                this.comment = null;
                this.vote = null;

                for (let i = 0; i < this.selectedVeto.mediations.length; i++) {
                    let mediation = this.selectedVeto.mediations[i];

                    if (mediation.mediator.id === this.userId) {
                        if (mediation.comment) this.comment = mediation.comment;
                        if (mediation.vote) this.vote = mediation.vote;

                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
        async submitMediation (e) {
            if (!this.vote || !this.comment.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const veto = await this.executePost(
                    `vetoes/submitMediation/${this.selectedVeto.id}`,
                    {
                        mediationId: this.mediationId,
                        vote: this.vote,
                        comment: this.comment,
                    },
                    e
                );

                if (veto && !veto.error) {
                    this.$store.dispatch('updateVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Submitted mediation`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>
