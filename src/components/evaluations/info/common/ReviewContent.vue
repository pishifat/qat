<template>
    <div class="row my-3">
        <div class="col-sm-2">
            <user-avatar
                v-if="loggedInUser.isNat"
                :user="review.evaluator"
                :text-color="voteColor(review.vote)"
                :align-start="true"
            />

            <div v-else class="small text-center my-2" :class="voteColor(review.vote)">
                User {{ index }}

                <div v-if="review.evaluator && review.evaluator.id == loggedInUser.id">
                    (this is you!)
                </div>
            </div>
        </div>

        <div class="col-sm-10">
            <div class="row">
                <div class="col-sm-12">
                    <b>Modding:</b>
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
import { mapState } from 'vuex';
import UserAvatar from '../../../UserAvatar.vue';

export default {
    name: 'ReviewContent',
    components: {
        UserAvatar,
    },
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
