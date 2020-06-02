<template>
    <div>
        <!-- agree -->
        <votes-inactive-type
            :mediations="agreeMediations"
            type="Agree"
            :total-mediations="totalMediations"
        />

        <!-- neutral -->
        <votes-inactive-type
            v-if="selectedDiscussionVote.neutralAllowed"
            :mediations="neutralMediations"
            type="Neutral"
            :total-mediations="totalMediations"
        />

        <!-- disagree -->
        <votes-inactive-type
            :mediations="disagreeMediations"
            type="Disagree"
            :total-mediations="totalMediations"
        />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import VotesInactiveType from './VotesInactiveType.vue';

export default {
    name: 'VotesInactive',
    components: {
        VotesInactiveType,
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
        totalMediations() {
            return this.agreeMediations.length + this.neutralMediations.length + this.disagreeMediations.length;
        },
        agreeMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 2);
        },
        disagreeMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 3);
        },
    },
};
</script>