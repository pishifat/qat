<template>
    <div>
        <template v-if="(loggedInUser && (loggedInUser.isNat || loggedInUser.isTrialNat)) && !selectedEvaluation.user.isNat">
            <hr>
            <p>
                <a href="#consensusSettings" data-bs-toggle="collapse">
                    Consensus settings <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="consensusSettings" class="collapse container mb-4">
                <div class="row align-items-center">
                    <div :class="selectedEvaluation.isApplication ? 'col-sm-5' : 'col-sm-12'">
                        <consensus />
                    </div>
                    <div class="col-sm-3">
                        <evaluation-is-reviewed
                            v-if="loggedInUser && loggedInUser.isNat && selectedEvaluation.consensus && !selectedEvaluation.isResignation"
                            :feedback="selectedEvaluation.feedback"
                        />
                    </div>
                    <div class="col-sm-4">
                        <nat-buddy-assignment
                            v-if="
                                loggedInUser &&
                                    loggedInUser.isNat &&
                                    selectedEvaluation.isApplication &&
                                    selectedEvaluation.consensus === 'pass'
                            "
                        />
                    </div>
                </div>

                <hr v-if="selectedEvaluation.consensus">
                <feedback-info v-if="selectedEvaluation.consensus" />
            </div>
        </template>

        <!-- Only NAT can see the reviews if the application is active -->
        <template
            v-if="
                loggedInUser &&
                    (!selectedEvaluation.active ||
                        loggedInUser.isNat ||
                        loggedInUser.isTrialNat)
            "
        >
            <hr v-if="selectedEvaluation.reviews.length">
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
