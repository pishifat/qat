<template>
    <div>
        <div v-for="(evaluation, i) in evaluations" :key="evaluation.id">
            <evaluation-content
                :evaluation="evaluation"
                :index="i + 1"
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
    },
};
</script>
