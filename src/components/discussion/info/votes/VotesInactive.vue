<template>
    <div>
        <hr>
        <!-- vcc violations -->
        <div v-if="selectedDiscussion.isContentReview && !selectedDiscussion.isAcceptable">
            Violations against the <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a>:
            <ul>
                <span v-for="option in visualContentConsiderations" :key="option.name">
                    <li v-if="countVccSelections(option.name)"><b>{{ option.text }}:</b> {{ countVccSelections(option.name) }} vote{{ countVccSelections(option.name) == 1 ? '' : 's' }}</li>
                </span>
            </ul>
            <hr>
        </div>

        <!-- show/hide bns button -->
        <button
            v-if="selectedDiscussion.isContentReview"
            class="btn btn-sm w-100 btn-primary ms-2 mb-2"
            type="submit"
            @click="showAll = !showAll"
        >
            {{ showAll ? 'Hide BN votes' : 'Show all votes' }}
        </button>

        <!-- agree -->
        <votes-inactive-type
            v-if="!selectedDiscussion.onlyWrittenInput"
            :bn-mediations="agreeMediations('bn')"
            :nat-gmt-mediations="agreeMediations('natGmt')"
            :type="selectedDiscussion.agreeOverwriteText ? selectedDiscussion.agreeOverwriteText : 'Yes/Agree'"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />

        <!-- neutral -->
        <votes-inactive-type
            v-if="!selectedDiscussion.onlyWrittenInput && selectedDiscussion.neutralAllowed"
            :bn-mediations="neutralMediations('bn')"
            :nat-gmt-mediations="neutralMediations('natGmt')"
            :type="selectedDiscussion.neutralOverwriteText ? selectedDiscussion.neutralOverwriteText : 'Neutral'"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />

        <!-- disagree -->
        <votes-inactive-type
            v-if="!selectedDiscussion.onlyWrittenInput"
            :bn-mediations="disagreeMediations('bn')"
            :nat-gmt-mediations="disagreeMediations('natGmt')"
            :type="selectedDiscussion.disagreeOverwriteText ? selectedDiscussion.disagreeOverwriteText : 'No/Disagree'"
            :total-bn-mediations="totalBnMediations"
            :total-nat-gmt-mediations="totalNatGmtMediations"
            :show-all="showAll"
        />

        <!-- only written input -->
        <votes-inactive-type
            v-if="selectedDiscussion.onlyWrittenInput"
            :bn-mediations="neutralMediations('bn')"
            :nat-gmt-mediations="neutralMediations('natGmt')"
            :show-all="showAll"
            :only-written-input="true"
        />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import discussionStoreMixin from '../../../../mixins/discussionStore';
import VotesInactiveType from './VotesInactiveType.vue';
import enums from 'shared/enums';
const { VisualContentConsiderations } = enums;

export default {
    name: 'VotesInactive',
    components: {
        VotesInactiveType,
    },
    mixins: [discussionStoreMixin],
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
        totalNatGmtMediations() {
            return this.agreeMediations('natGmt').length + this.neutralMediations('natGmt').length + this.disagreeMediations('natGmt').length;
        },
        totalBnMediations() {
            return this.agreeMediations('bn').length + this.neutralMediations('bn').length + this.disagreeMediations('bn').length;
        },
    },
    methods: {
        filterNatGmt(mediations) {
            return mediations.filter(mediation =>
                mediation.mediator?.groups?.includes('gmt') || mediation.mediator?.groups?.includes('nat')
            );
        },
        filterBn(mediations) {
            return mediations.filter(mediation =>
                !mediation.mediator?.groups?.includes('gmt') && !mediation.mediator?.groups?.includes('nat')
            );
        },
        agreeMediations(filter) {
            let m = this.selectedDiscussion.mediations.filter(mediation => mediation.vote == 1);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
        neutralMediations(filter) {
            let m = this.selectedDiscussion.mediations.filter(mediation => mediation.vote == 2);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
        disagreeMediations(filter) {
            let m = this.selectedDiscussion.mediations.filter(mediation => mediation.vote == 3);

            if (filter == 'natGmt') m = this.filterNatGmt(m);
            else if (filter == 'bn') m = this.filterBn(m);

            return m;
        },
        countVccSelections(name) {
            let count = 0;

            for (const mediation of this.selectedDiscussion.mediations) {
                if (mediation.vccChecked && mediation.vccChecked.includes(name)) {
                    count++;
                }
            }

            return count;
        },
    },
};
</script>