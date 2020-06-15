<template>
    <div
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12 my-2"
        @click="select()"
    >
        <div
            class="card cursor-pointer"
            :class="[isSelected ? 'bg-blue-gray' : '', 'border-' + relevantReviewVote, isNatEvaluator ? 'bg-primary' : '']"
            data-toggle="modal"
            :data-target="target"
        >
            <card-header
                :mode="evaluation.mode"
                :username="username"
                :osu-id="osuId"
                :consensus="evaluation.consensus"
            />

            <card-footer
                :evaluation-id="evaluation.id"
                :reviews="evaluation.reviews"
                :deadline="evaluation.deadline"
                :feedback="evaluation.feedback"
                :is-discussion="evaluation.discussion"
                :is-active="evaluation.active"
            />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import CardHeader from './CardHeader.vue';
import CardFooter from './CardFooter.vue';

export default {
    name: 'EvaluationCard',
    components: {
        CardHeader,
        CardFooter,
    },
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
        target: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('evaluations', [
            'checkedEvaluations',
        ]),
        relevantReviewVote () {
            const review = this.evaluation.reviews.find(e => e.evaluator && e.evaluator.id == this.loggedInUser.id);

            if (review) {
                switch (review.vote) {
                    case 1:
                        return 'pass';
                    case 2:
                        return 'neutral';
                    case 3:
                        return 'fail';
                }
            }

            return '';
        },
        isNatEvaluator () {
            return this.evaluation.natEvaluators && this.evaluation.natEvaluators.some(e => e.id == this.loggedInUser.id);
        },
        username () {
            return this.evaluation.user.username;
        },
        osuId () {
            return this.evaluation.user.osuId;
        },
        isSelected () {
            if (!this.checkedEvaluations) return false;

            return this.checkedEvaluations.includes(this.evaluation.id);
        },
    },
    methods: {
        select() {
            this.$store.commit('evaluations/setSelectedEvaluationId', this.evaluation.id);

            if (this.$route.query.id !== this.evaluation.id) {
                let url = '/evalarchive';

                if (this.evaluation.active) {
                    if (this.evaluation.kind === 'application') {
                        url = '/appeval';
                    } else {
                        url = '/bneval';
                    }
                }

                this.$router.replace(`${url}?id=${this.evaluation.id}`);
            }
        },
    },
};
</script>
