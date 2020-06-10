<template>
    <div>
        <div v-if="isNat">
            <div v-for="evaluation in natEvaluations" :key="evaluation.id">
                <evaluation-content
                    :evaluation="evaluation"
                />

                <hr>
            </div>
            <div v-for="evaluation in bnEvaluations" :key="evaluation.id">
                <evaluation-content
                    :evaluation="evaluation"
                />

                <hr>
            </div>
        </div>

        <div v-else>
            <div v-for="(evaluation, i) in evaluations" :key="evaluation.id">
                <evaluation-content
                    :evaluation="evaluation"
                    :index="i + 1"
                />

                <hr>
            </div>
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
        natEvaluations() {
            return this.evaluations.filter(e => e.evaluator.isNat);
        },
        bnEvaluations() {
            return this.evaluations.filter(e => !e.evaluator.isNat);
        },
    },
};
</script>
