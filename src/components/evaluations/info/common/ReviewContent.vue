<template>
    <div class="row my-3">
        <div class="col-sm-2">
            <user-avatar
                v-if="loggedInUser && (loggedInUser.isNat || loggedInUser.isTrialNat) && review.evaluator.username"
                :user="review.evaluator"
                :text-color="voteColor(review.vote)"
                :align-start="true"
            >
                <a
                    v-if="loggedInUser && loggedInUser.isNatLeader"
                    href="#"
                    @click.prevent="deleteReview()"
                    class="text-danger"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Delete review"
                >
                    <i class="fas fa-trash-alt" />
                </a>
            </user-avatar>

            <div v-else class="text-center my-2 text-pastel-blue">
                <b :class="canSeeOwnVote() ? voteColor(review.vote) : ''">Evaluator {{ index }}</b>

                <div v-if="canSeeOwnVote()" :class="voteColor(review.vote)">
                    (this is you!)
                </div>
            </div>
        </div>

        <div class="col-sm-10">
            <div class="row">
                <div class="col-sm-12">
                    <b>{{ selectedEvaluation.user.isNat ? 'NAT activity:' : 'Modding:' }}</b>
                    <div class="small ml-2 card card-body" v-html="$md.render(review.moddingComment)" />
                </div>
                <div v-if="review.behaviorComment" class="col-sm-12">
                    <b>Behavior:</b>
                    <div class="small ml-2 card card-body" v-html="$md.render(review.behaviorComment)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserAvatar from '../../../UserAvatar.vue';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'ReviewContent',
    components: {
        UserAvatar,
    },
    mixins: [evaluations],
    props: {
        review: {
            type: Object,
            required: true,
        },
        index: {
            type: Number,
            default: 1,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation']
        ),
    },
    methods: {
        voteColor(vote) {
            if (vote == 1) {
                return 'text-pass';
            } else if (vote == 2) {
                return 'text-neutral';
            } else if (vote == 3) {
                return 'text-fail';
            }
        },
        canSeeOwnVote() {
            return this.loggedInUser && this.review.evaluator && this.review.evaluator._id == this.loggedInUser._id;
        },
        async deleteReview() {
            if (confirm('Are you sure you want to delete this review?')) {
                const res = await this.$http.executePost(`/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/deleteReview/${this.selectedEvaluation.id}`, {
                    reviewId: this.review.id,
                });

                if (this.$http.isValid(res)) {
                    this.$store.commit('evaluations/updateEvaluation', res);

                    this.$store.dispatch('updateToastMessages', {
                        message: `Deleted review`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>
