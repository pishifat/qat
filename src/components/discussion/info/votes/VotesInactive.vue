<template>
    <div>
        <hr>
        <!-- vcc violations -->
        <div v-if="selectedDiscussionVote.isContentReview && !selectedDiscussionVote.isAcceptable">
            Violations against the <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a>:
            <ul>
                <span v-for="option in visualContentConsiderations" :key="option.name">
                    <li v-if="countVccSelections(option.name)"><b>{{ option.text }}</b> - {{ countVccSelections(option.name)}} vote{{ countVccSelections(option.name) == 1 ? '' : 's' }}</li>
                </span>
            </ul>
            <hr>
        </div>

        <!-- show/hide bns button -->
        <button v-if="loggedInUser.hasBasicAccess" class="btn btn-sm btn-block btn-primary ml-2 mb-2" type="submit" @click="showAll = !showAll">
            {{ showAll ? 'Hide BN votes' : 'Show all votes' }}
        </button>

        <!-- agree -->
        <votes-inactive-type
            :bn-mediations="agreeMediations('bn')"
            :nat-gmt-mediations="agreeMediations('natGmt')"
            :type="selectedDiscussionVote.agreeOverwriteText ? selectedDiscussionVote.agreeOverwriteText : 'Yes/Agree'"
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
            :type="selectedDiscussionVote.disagreeOverwriteText ? selectedDiscussionVote.disagreeOverwriteText : 'No/Disagree'"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import VotesInactiveType from './VotesInactiveType.vue';
import { VisualContentConsiderations } from '../../../../../shared/enums.js';

export default {
    name: 'VotesInactive',
    components: {
        VotesInactiveType,
    },
    data () {
        return {
            showAll: true,
            visualContentConsiderations: VisualContentConsiderations,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
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
        countVccSelections(name) {
            let count = 0;

            for (const mediation of this.selectedDiscussionVote.mediations) {
                if (mediation.vccChecked && mediation.vccChecked.includes(name)) {
                    count++;
                }
            }

            return count;
        }
    },
};
</script>