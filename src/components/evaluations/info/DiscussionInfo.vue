<template>
    <div>
        <template v-if="loggedInUser.isNat">
            <p>
                <a href="#additionalDiscussionInfo" data-toggle="collapse">
                    Additional Discussion info <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="additionalDiscussionInfo" class="collapse container">
                <consensus />
                <cooldown
                    v-if="selectedEvaluation && selectedEvaluation.consensus == 'fail'"
                />
                <feedback-info
                    v-if="selectedEvaluation.consensus && !(selectedEvaluation.isMoveToNat || selectedEvaluation.isMoveToBn)"
                />
            </div>
        </template>

        <!-- Only NAT can see the reviews if there isn't a consensus -->
        <template v-if="selectedEvaluation.consensus || loggedInUser.isNat">
            <hr>
            <reviews-listing />
        </template>

        <p v-else class="small">
            No consensus has been set, so evaluations are not visible. Check back later!
        </p>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Consensus from './common/Consensus.vue';
import Cooldown from './common/Cooldown.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import FeedbackInfo from './common/FeedbackInfo.vue';

export default {
    name: 'DiscussionInfo',
    components: {
        Consensus,
        Cooldown,
        ReviewsListing,
        FeedbackInfo,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
};
</script>
