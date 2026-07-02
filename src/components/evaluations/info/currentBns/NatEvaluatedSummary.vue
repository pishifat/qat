<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <b>Your submitted summary:</b>
                <span v-if="selfSummaryComment" class="small" v-html="$md.render(selfSummaryComment)" />
                <span v-else class="text-secondary">None...</span>
            </div>
        </div>
        <p class="small text-secondary mt-3 mb-0">
            NAT leaders are reviewing your evaluation.
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations';

export default {
    name: 'NatEvaluatedSummary',
    mixins: [ evaluations ],
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        selfSummaryComment () {
            return this.getSelfSummaryComment(this.selectedEvaluation);
        },
    },
};
</script>
