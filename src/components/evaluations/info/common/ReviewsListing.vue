<template>
    <div>
        <div v-for="(review, i) in selectedEvaluation.reviews" :key="review.id">
            <review-content
                :review="review"
                :index="i + 1"
            />

            <hr>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ReviewContent from './ReviewContent.vue';

export default {
    name: 'ReviewsListing',
    components: {
        ReviewContent,
    },
    computed: mapGetters('evaluations', [
        'selectedEvaluation',
    ]),
};
</script>
