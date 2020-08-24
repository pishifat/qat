<template>
    <div>
        <p>
            <b>Consensus:</b>
            <span
                v-if="selectedEvaluation.consensus"
                class="mr-2 text-capitalize"
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
                class="mr-2 text-capitalize"
                :class="consensusColor"
            >
                {{ additionText }}
            </span>
            <span v-if="selectedEvaluation.active" class="btn-group">
                <button
                    class="btn btn-sm btn-primary"
                    :disabled="lowActivityWarning"
                    @click="setAddition('lowActivityWarning', $event);"
                >
                    Low Activity Warning
                </button>
                <button
                    class="btn btn-sm btn-primary"
                    :disabled="!selectedEvaluation.addition || noAddition"
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
        ]),
        consensus () {
            return this.selectedEvaluation.consensus;
        },
        addition () {
            return this.selectedEvaluation.addition;
        },
        buttons () {
            if (this.selectedEvaluation.isBnEvaluation) {
                return [
                    { consensus: 'fullBn', color: 'btn-success' },
                    { consensus: 'probationBn', color: 'btn-probation' },
                    { consensus: 'removeFromBn', color: 'btn-danger' },
                ];
            }

            if (this.selectedEvaluation.isResignation) {
                return [
                    { consensus: 'resignedOnGoodTerms', color: 'btn-success' },
                    { consensus: 'resignedOnStandardTerms', color: 'btn-neutral' },
                ];
            }

            if (this.selectedEvaluation.isApplication) {
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
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setConsensus/` + this.selectedEvaluation.id, { consensus }, e);

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
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setAddition/` + this.selectedEvaluation.id, { addition }, e);

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
