<template>
    <div>
        <hr>
        Mediation response:
        <div class="small px-4 mb-2 text-secondary">
            Your comments will be shown anonymously on the map thread. Clearly explain why you agree or disagree with each reason. Inappropriate responses will be discarded.
        </div>

        <div v-for="(reason, i) in selectedVeto.reasons" :key="i">
            <a :href="reason.link" target="_blank">{{ i+1 }}. {{ reason.summary }}</a>
            <textarea
                id="comment"
                v-model="input.comments[i]"
                class="form-control mb-2"
                placeholder="Why you agree/disagree with the above veto reason..."
                rows="3"
            />

            <div class="d-flex justify-content-end mb-2">
                <div class="form-check form-check-inline">
                    <input
                        :id="'1' + i"
                        v-model="vote.votes[i]"
                        class="form-check-input"
                        type="radio"
                        :name="'vote' + i"
                        value="1"
                    >
                    <label class="form-check-label text-success" for="1">Agree</label>
                </div>

                <div class="form-check form-check-inline">
                    <input
                        :id="'2' + i"
                        v-model="vote.votes[i]"
                        class="form-check-input"
                        type="radio"
                        :name="'vote' + i"
                        value="2"
                    >
                    <label class="form-check-label text-neutral" for="2">Partially agree</label>
                </div>

                <div class="form-check form-check-inline">
                    <input
                        :id="'3' + i"
                        v-model="vote.votes[i]"
                        class="form-check-input"
                        type="radio"
                        :name="'vote' + i"
                        value="3"
                    >
                    <label class="form-check-label text-danger" for="3">Disagree</label>
                </div>
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

export default {
    name: 'MediationInput',
    data() {
        return {
            input: {
                comments: [],
            },
            vote: {
                votes: [],
            },
            mediation: {
                mediationIds: [],
            },
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
                this.mediation.mediationIds = [];
                this.input.comments = [];
                this.vote.votes = [];

                for (let i = 0; i < this.selectedVeto.reasons.length; i++) {
                    for (const mediation of this.selectedVeto.mediations) {
                        if (mediation.mediator && mediation.mediator.id === this.loggedInUser.id && mediation.reasonIndex == i) {
                            this.input.comments[i] = mediation.comment;
                            this.vote.votes[i] = mediation.vote;
                            this.mediation.mediationIds[i] = mediation.id;
                        }
                    }
                }
            }
        },
        async submitMediation (e) {
            const data = await this.$http.executePost(
                `vetoes/submitMediation/${this.selectedVeto.id}`,
                {
                    mediation: this.mediation,
                    vote: this.vote,
                    input: this.input,
                },
                e
            );

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    },
};
</script>
