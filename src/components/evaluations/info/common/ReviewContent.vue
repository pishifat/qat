<template>
    <div class="row my-3">
        <div class="col-sm-2">
            <user-avatar
                v-if="loggedInUser.isNat || loggedInUser.isTrialNat"
                :user="review.evaluator"
                :text-color="voteColor(review.vote)"
                :align-start="true"
            />

            <div v-else class="small text-center my-2" :class="voteColor(review.vote)">
                User {{ index }} ({{ review.evaluator && review.evaluator.groups.includes('nat') ? 'NAT' : 'BN' }})

                <div v-if="review.evaluator && review.evaluator.id == loggedInUser.id">
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
                <div class="col-sm-12">
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
    },
};
</script>
