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
            <p class="text-shadow min-spacing mt-1 mr-2" :class="info.length ? 'errors' : 'confirm'">
                {{ info }} {{ confirm }}
            </p>
            <button class="btn btn-sm btn-nat" @click="submitMediation($event)">
                Submit mediation
            </button>
        </div>
    </div>
</template>

<script>
import postData from '../../../mixins/postData';

export default {
    name: 'MediationInput',
    mixins: [ postData ],
    props: {
        mediations: {
            type: Array,
            required: true,
        },
        vetoId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            info: '',
            confirm: '',
            comment: '',
            vote: null,
            mediationId: null,
        };
    },
    watch: {
        veto() {
            this.findUserMediation();
        },
    },
    mounted() {
        this.findUserMediation();
    },
    methods: {
        findUserMediation() {
            this.info = '';
            this.confirm = '';
            this.mediationId = null;

            for (let i = 0; i < this.mediations.length; i++) {
                let mediation = this.mediations[i];

                if (mediation.mediator.id === this.userId) {
                    if (mediation.comment) this.comment = mediation.comment;
                    if (mediation.vote) this.vote = mediation.vote;

                    this.mediationId = mediation.id;
                    break;
                }
            }
        },
        async submitMediation (e) {
            this.confirm = '';
            this.info = '';

            if (!this.vote || !this.comment.length) {
                this.info = 'Cannot leave fields blank!';
            } else {
                const v = await this.executePost(
                    `vetoes/submitMediation/${this.vetoId}`,
                    {
                        mediationId: this.mediationId,
                        vote: this.vote,
                        comment: this.comment,
                    },
                    e
                );

                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation submitted!';
                    }
                }
            }
        },
    },
};
</script>
