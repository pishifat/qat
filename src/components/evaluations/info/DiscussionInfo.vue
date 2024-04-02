<template>
    <div>
        <template v-if="loggedInUser.isNat || loggedInUser.isTrialNat">
            <hr>
            <p>
                <a href="#consensusSettings" data-toggle="collapse">
                    Consensus settings <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="consensusSettings" class="collapse container mb-4">
                <consensus />
                <evaluation-is-security-checked 
                    v-if="
                        loggedInUser.isNat && 
                        selectedEvaluation.isApplication && 
                        selectedEvaluation.consensus === 'pass'
                    "
                />
                <nat-buddy-assignment 
                    v-if="
                        loggedInUser.isNat && 
                        selectedEvaluation.isApplication && 
                        selectedEvaluation.consensus === 'pass'
                    "
                />
                <hr v-if="selectedEvaluation.consensus" />
                <evaluation-link v-if="selectedEvaluation.feedback" />
                <evaluation-is-reviewed
                    v-if="loggedInUser.isNat"
                    :feedback="selectedEvaluation.feedback"
                />
                <feedback-info v-if="selectedEvaluation.consensus" />
            </div>
        </template>

        <!-- Only NAT can see the reviews if the application is active -->
        <template
            v-if="
                !selectedEvaluation.active ||
                loggedInUser.isNat ||
                loggedInUser.isTrialNat
            "
        >
            <hr />
            <reviews-listing />
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Consensus from './common/Consensus.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import FeedbackInfo from './common/FeedbackInfo.vue';
import evaluations from '../../../mixins/evaluations.js';
import EvaluationIsReviewed from './common/EvaluationIsReviewed.vue';
import EvaluationIsSecurityChecked from './applications/EvaluationIsSecurityChecked.vue';
import NatBuddyAssignment from './applications/NatBuddyAssignment.vue';
import EvaluationLink from './common/EvaluationLink.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        Consensus,
        ReviewsListing,
        FeedbackInfo,
        EvaluationIsReviewed,
        EvaluationIsSecurityChecked,
        EvaluationLink,
        NatBuddyAssignment,
    },
    mixins: [evaluations],
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('evaluations', ['selectedEvaluation']),
        consensus() {
            return this.selectedEvaluation.consensus;
        },
    },
};
</script>
