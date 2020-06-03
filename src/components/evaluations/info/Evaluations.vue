<template>
    <div>
        <div v-for="evaluation in natEvaluations" :key="evaluation.id">
            <evaluation-content
                content-type="nat"
                :evaluation="evaluation"
            />

            <hr>
        </div>

        <div v-for="evaluation in bnEvaluations" :key="evaluation.id">
            <evaluation-content
                content-type="bn"
                :evaluation="evaluation"
            />

            <hr>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import EvaluationContent from './EvaluationContent.vue';

export default {
    name: 'Evaluations',
    components: {
        EvaluationContent,
    },
    props: {
        evaluations: {
            type: Array,
            default() {
                return [];
            },
        },
        consensus: {
            type: String,
            default: '',
        },
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        ...mapGetters([
            'evaluatorId',
        ]),
        bnEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if (this.isNat) {
                    if (evaluation.evaluator.isBn || evaluation.evaluator.group == 'user') e.push(evaluation);
                } else {
                    let consensusVote;
                    if (this.consensus == 'pass') consensusVote = 1;
                    if (this.consensus == 'fail') consensusVote = 3;
                    if (evaluation.evaluator.isBn && (evaluation.vote == consensusVote || evaluation.vote == 2 || evaluation.evaluator.id == this.evaluatorId)) e.push(evaluation);
                }
            });

            return e;
        },
        natEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if (this.isNat) {
                    if (evaluation.evaluator.isNat) e.push(evaluation);
                } else {
                    let consensusVote;
                    if (this.consensus == 'pass') consensusVote = 1;
                    if (this.consensus == 'fail') consensusVote = 3;
                    if (evaluation.evaluator.isNat && (evaluation.vote == consensusVote || evaluation.vote == 2)) e.push(evaluation);
                }
            });

            return e;
        },
    },
};
</script>
