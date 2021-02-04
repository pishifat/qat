<template>
    <div>
        <hr>
        <button class="btn btn-sm btn-block btn-primary ml-2 mb-2" type="submit" @click="showAll = !showAll">
            {{ showAll ? 'Hide BN votes' : 'Show all votes' }}
        </button>
        <!-- agree -->
        <votes-inactive-type
            :bn-mediations="agreeMediations('bn')"
            :nat-gmt-mediations="agreeMediations('natGmt')"
            type="Yes/Agree"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />

        <!-- neutral -->
        <votes-inactive-type
            v-if="selectedDiscussionVote.neutralAllowed"
            :bn-mediations="neutralMediations('bn')"
            :nat-gmt-mediations="neutralMediations('natGmt')"
            type="Neutral"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />

        <!-- disagree -->
        <votes-inactive-type
            :bn-mediations="disagreeMediations('bn')"
            :nat-gmt-mediations="disagreeMediations('natGmt')"
            type="No/Disagree"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
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
        totalNatGmtMediations() {
            return this.agreeMediations('natGmt').length + this.neutralMediations('natGmt').length + this.disagreeMediations('natGmt').length;
        },
        totalBnMediations() {
            return this.agreeMediations('bn').length + this.neutralMediations('bn').length + this.disagreeMediations('bn').length;
        },
    },
    methods: {
        filterNatGmt (mediations) {
            return mediations.filter(mediation => mediation.mediator.groups.includes('gmt') || mediation.mediator.groups.includes('nat'));
        },
        filterBn (mediations) {
            return mediations.filter(mediation => !mediation.mediator.groups.includes('gmt') && !mediation.mediator.groups.includes('nat'));
        },
        agreeMediations(filter) {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 1);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
        neutralMediations(filter) {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 2);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
        disagreeMediations(filter) {
            let m = this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 3);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
    },
};
</script>