<template>
    <div>
        <b>Give your opinion on the veto!</b>
        <div class="mb-4">
            If the Beatmap Nominators don't reach a conclusion, your vote will determine whether the veto is upheld or dismissed.
        </div>

        <div v-for="(reason, i) in selectedVeto.reasons" :key="i">
            <b>{{ i+1 }}. {{ reason.summary }}</b>

            <div class="d-flex mb-4">
                <div class="form-check form-check-inline">
                    <input
                        :id="'1' + i"
                        v-model="vote.votes[i]"
                        class="form-check-input"
                        type="radio"
                        :name="'vote' + i"
                        value="1"
                    >
                    <label class="form-check-label text-success" for="1">Agree with the veto reason</label>
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
                    <label class="form-check-label text-neutral" for="1">Neutral</label>
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
                    <label class="form-check-label text-danger" for="3">Disagree with the veto reason</label>
                </div>
            </div>
        </div>

        <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-primary" @click="submitPublicMediation($event)">
                Submit vote
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
    name: 'PublicMediationInput',
    data() {
        return {
            vote: {
                votes: [],
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
            if (this.loggedInUser) {
                this.vote.votes = [];

                for (let i = 0; i < this.selectedVeto.reasons.length; i++) {
                    for (const mediation of this.selectedVeto.publicMediations) {
                        if (mediation.mediator && mediation.mediator.id === this.loggedInUser.id && mediation.reasonIndex == i) {
                            this.vote.votes[i] = mediation.vote;
                        }
                    }
                }
            }
        },
        async submitPublicMediation (e) {
            const data = await this.$http.executePost(`/vetoes/submitPublicMediation/${this.selectedVeto.id}`, { vote: this.vote }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    },
};
</script>
