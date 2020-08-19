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
            <span v-if="selectedEvaluation.active">
                <button
                    class="btn btn-sm btn-pass"
                    :disabled="selectedEvaluation.consensus == 'pass' || selectedEvaluation.consensus == 'fullBn'"
                    @click="setConsensus(isApplication ? 'pass' : 'fullBn', $event);"
                >
                    {{ isApplication ? 'Pass' : 'Full BN' }}
                </button>
                <button
                    v-if="!isApplication"
                    class="btn btn-sm btn-probation"
                    :disabled="selectedEvaluation.consensus == 'probationBn'"
                    @click="setConsensus('probationBn', $event);"
                >
                    Probation BN
                </button>
                <button
                    class="btn btn-sm btn-fail"
                    :disabled="selectedEvaluation.consensus == 'fail' || selectedEvaluation.consensus == 'removeFromBn'"
                    @click="setConsensus(isApplication ? 'fail' : 'removeFromBn', $event);"
                >
                    {{ isApplication ? 'Fail' : 'Remove from BN' }}
                </button>
            </span>
        </p>

        <p v-if="!isApplication && selectedEvaluation.consensus !== 'probationBn'">
            <b>Addition:</b>
            <span
                class="mr-2"
                :class="consensusColor"
            >
                {{ additionText }}
            </span>
            <span v-if="selectedEvaluation.active">
                <button
                    v-if="selectedEvaluation.consensus == 'removeFromBn'"
                    class="btn btn-sm btn-primary"
                    :disabled="selectedEvaluation.addition == 'resignedOnGoodTerms'"
                    @click="setAddition('resignedOnGoodTerms', $event);"
                >
                    Resign on good terms
                </button>
                <button
                    v-if="selectedEvaluation.consensus == 'removeFromBn'"
                    class="btn btn-sm btn-primary"
                    :disabled="selectedEvaluation.addition == 'resignedOnStandardTerms'"
                    @click="setAddition('resignedOnStandardTerms', $event);"
                >
                    Resign on standard terms
                </button>
                <button
                    v-if="selectedEvaluation.consensus == 'fullBn'"
                    class="btn btn-sm btn-primary"
                    :disabled="selectedEvaluation.addition == 'lowActivity'"
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

export default {
    name: 'Consensus',
    mixins: [ postData ],
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
        consensusText() {
            const consensus = this.selectedEvaluation.consensus;

            switch (consensus) {
                case null:
                    return 'None';
                case 'fullBn':
                    return 'Full BN';
                case 'probationBn':
                    return 'Probation BN';
                case 'removeFromBn':
                    return 'Remove from BN';
                default:
                    return consensus;
            }
        },
        additionText() {
            const addition = this.selectedEvaluation.addition;

            switch (addition) {
                case 'lowActivity':
                    return 'Low activity warning';
                case 'resignedOnGoodTerms':
                    return 'Resigned on good terms';
                case 'resignedOnStandardTerms':
                    return 'Resigned on standard terms';
                default:
                    return 'None';
            }
        },
        consensusColor() {
            const consensus = this.selectedEvaluation.consensus;

            switch (consensus) {
                case 'pass':
                    return 'text-pass';
                case 'fullBn':
                    return 'text-pass';
                case 'fail':
                    return 'text-fail';
                case 'removeFromBn':
                    return 'text-fail';
                case 'probationBn':
                    return 'text-probation';
                default:
                    return '';
            }
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
