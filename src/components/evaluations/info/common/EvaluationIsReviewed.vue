<template>
    <div>
        <p>
            <b>Reviewed: </b>
            <a
                href="#"
                data-toggle="tooltip"
                data-placement="right"
                title="mark evaluation as reviewed"
                @click.prevent="toggleEvaluationIsReviewed($event)"
            >
                <font-awesome-icon
                    icon="fa-solid fa-circle-check"
                    :class="selectedEvaluation.isReviewed ? 'text-success' : 'text-secondary'"
                />
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'EvaluationIsReviewed',
    mixins: [evaluations],
    computed: {
        ...mapGetters('evaluations', ['selectedEvaluation']),
    },
    methods: {
        async toggleEvaluationIsReviewed(e) {
            await this.$http.executePost(`/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/toggleIsReviewed/${this.selectedEvaluation.id}`, e);   
        },
    },
}
</script>
