<template>
    <div>
        <!-- User's own mock evaluation -->
        <template v-if="userMockReview">
            <review-content
                :review="userMockReview"
                :index="1"
            />
            <hr>
        </template>
        
        <!-- Regular reviews -->
        <div v-for="(review, i) in sortedReviews" :key="review.id">
            <review-content
                :review="review"
                :index="userMockReview ? i + 2 : i + 1"
            />

            <hr>
        </div>
        
        <!-- All mock evaluations section (for NAT/TrialNAT) -->
        <template v-if="hasMockReviews && (loggedInUser.isTrialNat || loggedInUser.isNat)">
            <p>
                <a href="#mockEvaluations" data-toggle="collapse">
                    Mock evaluations <i class="fas fa-angle-down" />
                </a>
            </p>
            
            <div id="mockEvaluations" class="collapse">
                <div v-for="(review, i) in sortedMockReviews" :key="review.id">
                    <review-content
                        :review="review"
                        :index="i + 1"
                    />
                    
                    <hr>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ReviewContent from './ReviewContent.vue';

export default {
    name: 'ReviewsListing',
    components: {
        ReviewContent,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        sortedReviews () {
            const reviews = this.selectedEvaluation.reviews || [];
            if (this.loggedInUser && this.loggedInUser.isNat) {
                const natReviews = reviews.filter(r => r.evaluator && r.evaluator.isNat);
                const bnReviews = reviews.filter(r => r.evaluator && !r.evaluator.isNat);

                return natReviews.concat(bnReviews).filter(r => r.vote);
            } else {
                return reviews.filter(r => r.vote);
            }
        },
        userMockReview() {
            if (this.loggedInUser && (this.loggedInUser.isNat || this.loggedInUser.isTrialNat)) {
                return null;
            }
            
            const mockReviews = this.selectedEvaluation.mockReviews || [];
            return mockReviews.find(r => r.evaluator && r.evaluator.id === this.loggedInUser?.id && r.vote);
        },
        hasMockReviews() {
            const mockReviews = this.selectedEvaluation.mockReviews || [];
            return mockReviews.some(r => r.vote);
        },
        sortedMockReviews() {
            const mockReviews = this.selectedEvaluation.mockReviews || [];
            return mockReviews.filter(r => r.vote);
        },
    },
};
</script>
