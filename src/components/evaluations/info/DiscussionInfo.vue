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
                        selectedEvaluation.kind != 'resignation'
                    "
                />
                <feedback-info v-if="selectedEvaluation.consensus" />
            </div>
        </template>

        <!-- Only NAT can see the reviews if there isn't a consensus -->
        <template
            v-if="
                selectedEvaluation.consensus ||
                loggedInUser.isNat ||
                loggedInUser.isTrialNat
            "
        >
            <hr />
            <reviews-listing />
        </template>

        <p v-else class="small">
            No consensus has been set, so evaluations are not visible. Check
            back later!
        </p>
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

export default {
    name: 'DiscussionInfo',
    components: {
        Consensus,
        Cooldown,
        ReviewsListing,
        FeedbackInfo,
        NextEvaluationEstimate,
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
