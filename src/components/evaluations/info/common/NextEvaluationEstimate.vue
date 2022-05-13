<template>
    <p>
        <b>Next evaluation:</b>
        <span :class="consensusColor">
            {{ `~${consensus == 'probationBn' || consensus == 'pass' ? '1' : evaluationsWithoutIncident > 1 ? '6' : '3'} month${consensus == 'probationBn' || consensus == 'pass' ? '' : 's'}` }}
        </span>
    </p>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'NextEvaluationEstimate',
    mixins: [ evaluations ],
    data() {
        return {
            evaluationsWithoutIncident: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string} */
        consensus () {
            return this.selectedEvaluation.consensus;
        },
    },
    watch: {
        async selectedEvaluation () {
            await this.findEvaluationsWithoutIncident();
        },
    },
    async mounted () {
        await this.findEvaluationsWithoutIncident();
    },
    methods: {
        async findEvaluationsWithoutIncident() {
            this.evaluationsWithoutIncident = await this.$http.executeGet(
                `/bnEval/findEvaluationsWithoutIncident/${this.selectedEvaluation.user.id}`
            );
        },
    },
};
</script>