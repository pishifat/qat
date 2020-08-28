<template>
    <div>
        <router-link :to="'/evalarchive?id=' + evaluation.id" class="small">
            {{ evaluation.isApplication ? evaluation.updatedAt.slice(0,10) : evaluation.deadline.slice(0,10) }}
            -
            <mode-display
                :modes="evaluation.mode"
            />

            {{ evaluation.isApplication ? 'APPLICATION' : evaluation.isBnEvaluation ? 'BN EVAL' : 'RESIGNATION' }}
        </router-link>
        -
        <small>
            <span :class="consensusColor">
                {{ makeWordFromField(consensus).toUpperCase() }}
            </span>
            <span v-if="evaluation.addition" :class="consensusColor">
                + {{ makeWordFromField(addition).toUpperCase() }}
            </span>
        </small>

        <div v-if="evaluation.feedback" v-html="$md.render(evaluation.feedback)" />
    </div>
</template>

<script>
import evaluations from '../../../../mixins/evaluations.js';
import ModeDisplay from '../../../ModeDisplay.vue';

export default {
    name: 'PreviousEvaluationEntry',
    components: {
        ModeDisplay,
    },
    mixins: [ evaluations ],
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
    },
    computed: {
        consensus () {
            return this.evaluation.consensus;
        },
    },
};
</script>