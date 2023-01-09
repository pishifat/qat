<template>
    <div>
        <template v-if="loggedInUser.isNat || loggedInUser.isTrialNat">
            <p>
                <a href="#consensusSettings" data-toggle="collapse">
                    Consensus settings <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="consensusSettings" class="collapse container">
                <consensus />
                <cooldown v-if="selectedEvaluation && negativeConsensus" />
                <next-evaluation-estimate
                    v-else-if="
                        selectedEvaluation.consensus &&
                        selectedEvaluation.kind != 'resignation' &&
                        loggedInUser.isNat
                    "
                />
                <evaluation-is-reviewed v-if="selectedEvaluation.feedback"/>
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
import Cooldown from './common/Cooldown.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import FeedbackInfo from './common/FeedbackInfo.vue';
import evaluations from '../../../mixins/evaluations.js';
import NextEvaluationEstimate from './common/NextEvaluationEstimate.vue';
import EvaluationIsReviewed from './common/EvaluationIsReviewed.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        Consensus,
        Cooldown,
        ReviewsListing,
        FeedbackInfo,
        NextEvaluationEstimate,
        EvaluationIsReviewed,
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
