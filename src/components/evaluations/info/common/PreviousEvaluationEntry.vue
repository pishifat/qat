<template>
    <div>
        <router-link :to="'/evalarchive?id=' + evaluation.id" class="small">
            {{ evaluation.archivedAt ? evaluation.archivedAt.toString().slice(0,10) : evaluation.deadline.toString().slice(0,10) }}
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
            <span v-if="addition" :class="consensusColor">
                + {{ makeWordFromField(addition).toUpperCase() }}
            </span>
        </small>

        <div v-if="evaluation.feedback">
            <div v-if="showFull || evaluation.feedback.length < 250" v-html="$md.render(evaluation.feedback)" />
            <div v-else class="row">
                <div class="col-sm-10" v-html="$md.render(short)" />
                <div class="col-sm-2">
                    <button class="btn btn-sm btn-primary" @click="showFull = true">
                        Show full feedback
                    </button>
                </div>
            </div>
        </div>
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
    data () {
        return {
            showFull: false,
        };
    },
    computed: {
        consensus () {
            return this.evaluation.consensus;
        },
        addition () {
            return this.evaluation.addition;
        },
        short () {
            let i = this.evaluation.feedback.indexOf('![]');
            let j = this.evaluation.feedback.indexOf('@[youtube]');

            if (i == -1 || (i > j && j !== -1)) i = j;

            if (i == -1 || i > 250) i = 250;

            return this.evaluation.feedback.slice(0,i).trim() + '... (*truncated*)';
        },
    },
};
</script>