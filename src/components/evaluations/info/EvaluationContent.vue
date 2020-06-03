<template>
    <div class="row my-3">
        <div class="col-sm-2">
            <user-avatar
                v-if="isNat"
                :user="evaluation.evaluator"
                :text-color="voteColor(evaluation.vote)"
                :align-start="true"
            />

            <div v-else class="small text-center my-2" :class="voteColor(evaluation.vote)">
                <span v-if="contentType === 'nat'">
                    NAT
                </span>
                <span v-else>
                    BN
                    <span v-if="evaluation.evaluator.id == evaluatorId">(this is you!)</span>
                </span>
            </div>
        </div>

        <div class="col-sm-10">
            <div class="row">
                <div class="col-sm-12">
                    <b>Modding:</b>
                    <div class="small ml-2 card card-body" v-html="$md.render(evaluation.moddingComment)" />
                </div>
                <div class="col-sm-12">
                    <b>Behavior:</b>
                    <div class="small ml-2 card card-body" v-html="$md.render(evaluation.behaviorComment)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserAvatar from '../../UserAvatar.vue';
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'EvaluationContent',
    components: {
        UserAvatar,
    },
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
        contentType: {
            type: String,
            default: 'bn',
        },
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        ...mapGetters([
            'evaluatorId',
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