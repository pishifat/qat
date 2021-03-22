<template>
    <div>
        <hr>
        Reason for vote:
        <div class="small px-4 mb-2">
            This comment will be displayed anonymously alongside the verdict post. If you partially agree with the veto, clearly say which points you agree/disagree with. Inappropriate responses will be discarded.
        </div>

        <textarea
            id="comment"
            v-model="comment"
            class="form-control mb-2"
            placeholder="Why you agree/disagree with the veto..."
            rows="3"
        />

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
                <label class="form-check-label text-success" for="1">Agree</label>
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
                <label class="form-check-label text-neutral" for="2">Partially agree</label>
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
                <label class="form-check-label text-danger" for="3">Disagree</label>
            </div>
        </div>

        <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-primary" @click="submitMediation($event)">
                Submit mediation
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
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
            if (this.loggedInUser.hasBasicAccess) { // mediator info is hidden from normal users, so this function wouldn't work
                this.mediationId = null;
                this.comment = null;
                this.vote = null;

                for (const mediation of this.selectedVeto.mediations) {
                    if (mediation.mediator && mediation.mediator.id === this.loggedInUser.id) {
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
                const data = await this.executePost(
                    `vetoes/submitMediation/${this.selectedVeto.id}`,
                    {
                        mediationId: this.mediationId,
                        vote: this.vote,
                        comment: this.comment,
                    },
                    e
                );

                if (data && !data.error) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    },
};
</script>
