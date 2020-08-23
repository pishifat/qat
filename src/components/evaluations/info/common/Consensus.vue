<template>
    <div>
        <p>
            <b>Consensus:</b>
            <span
                v-if="selectedEvaluation.consensus"
                class="mr-2"
                :class="consensusColor"
            >
                {{ consensusText }}
            </span>
            <span v-if="selectedEvaluation.active" class="btn-group">
                <button
                    v-for="button in buttons"
                    :key="button.consensus"
                    class="btn btn-sm text-capitalize"
                    :disabled="consensus === button.consensus"
                    :class="button.color"
                    @click="setConsensus(button.consensus, $event);"
                >
                    {{ makeWordFromField(button.consensus) }}
                </button>
            </span>
        </p>

        <p v-if="canHaveAddition">
            <b>Addition:</b>
            <span
                class="mr-2"
                :class="consensusColor"
            >
                {{ additionText }}
            </span>
            <span v-if="selectedEvaluation.active" class="btn-group">
                <button
                    class="btn btn-sm btn-primary"
                    :disabled="selectedEvaluation.addition === 'lowActivity'"
                    @click="setAddition('lowActivity', $event);"
                >
                    Low activity warning
                </button>
                <button
                    class="btn btn-sm btn-primary"
                    :disabled="!selectedEvaluation.addition || selectedEvaluation.addition == 'none'"
                    @click="setAddition('none', $event);"
                >
                    None
                </button>
            </span>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../../mixins/postData.js';
import evaluations from '../../../../mixins/evaluations.js';
import { EvaluationKind, BnEvaluationConsensus } from '../../../../../shared/enums.js';

export default {
    name: 'Consensus',
    mixins: [ postData, evaluations ],
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
        consensus () {
            return this.selectedEvaluation.consensus;
        },
        addition () {
            return this.selectedEvaluation.addition;
        },
        buttons () {
            if (this.selectedEvaluation.kind === EvaluationKind.BnEvaluation) {
                return [
                    { consensus: 'fullBn', color: 'btn-success' },
                    { consensus: 'probationBn', color: 'btn-neutral' },
                    { consensus: 'removeFromBn', color: 'btn-danger' },
                ];
            }

            if (this.selectedEvaluation.kind === EvaluationKind.Resignation) {
                return [
                    { consensus: 'resignedOnGoodTerms', color: 'btn-success' },
                    { consensus: 'resignedOnStandardTerms', color: 'btn-neutral' },
                ];
            }

            if (this.selectedEvaluation.kind === EvaluationKind.AppEvaluation) {
                return [
                    { consensus: 'pass', color: 'btn-success' },
                    { consensus: 'fail', color: 'btn-danger' },
                ];
            }

            return [];
        },
        canHaveAddition () {
            return this.selectedEvaluation.kind === EvaluationKind.BnEvaluation &&
                this.selectedEvaluation.consensus === BnEvaluationConsensus.FullBn;
        },
    },
    methods: {
        async setConsensus(consensus, e) {

            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setConsensus/` + this.selectedEvaluation.id, { consensus }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved consensus`,
                    type: 'success',
                });
            }
        },
        async setAddition(addition, e) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setAddition/` + this.selectedEvaluation.id, { addition }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved addition`,
                    type: 'success',
                });
            }
        },
    },
};
</script>
