<template>
    <div>
        <hr>
        <button class="btn btn-sm btn-block btn-primary ml-2 mb-2" type="submit" @click="showAll = !showAll">
            {{ showAll ? 'Show all votes' : 'Hide BN votes' }}
        </button>
        <!-- agree -->
        <votes-inactive-type
            :mediations="agreeMediations"
            type="Yes/Agree"
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
            type="No/Disagree"
            :total-mediations="totalMediations"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import VotesInactiveType from './VotesInactiveType.vue';

export default {
    name: 'VotesInactive',
    components: {
        VotesInactiveType,
    },
    data () {
        return {
            showAll: true,
        };
    },
    computed: {
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
        totalMediations() {
            return this.agreeMediations.length + this.neutralMediations.length + this.disagreeMediations.length;
        },
        agreeMediations() {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 1);

            if (this.showAll) m = this.filterAll(m);

            return m;
        },
        neutralMediations() {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 2);

            if (this.showAll) m = this.filterAll(m);

            return m;
        },
        disagreeMediations() {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 3);

            if (this.showAll) m = this.filterAll(m);

            return m;
        },
    },
    methods: {
        filterAll (mediations) {
            return mediations.filter(mediation => mediation.mediator.groups.includes('gmt') || mediation.mediator.groups.includes('nat'));
        },
    },
};
</script>