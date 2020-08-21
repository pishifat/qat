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
                    :disabled="selectedEvaluation.consensus == 'pass' || selectedEvaluation.consensus == 'fullBn' || selectedEvaluation.consensus == 'resignedOnGoodTerms'"
                    @click="setConsensus(selectedEvaluation.kind === 'application' ? 'pass' : selectedEvaluation.kind === 'currentBn' ? 'fullBn' : 'resignedOnGoodTerms', $event);"
                >
                    {{ selectedEvaluation.kind === 'application' ? 'Pass' : selectedEvaluation.kind === 'currentBn' ? 'Full BN' : 'Resigned on good terms' }}
                </button>
                <button
                    v-if="!isApplication"
                    class="btn btn-sm"
                    :class="selectedEvaluation.kind === 'currentBn' ? 'btn-probation' : 'btn-neutral'"
                    :disabled="selectedEvaluation.consensus == 'probationBn' || selectedEvaluation.consensus == 'resignedOnStandardTerms'"
                    @click="setConsensus(selectedEvaluation.kind === 'currentBn' ? 'probationBn' : 'resignedOnStandardTerms', $event);"
                >
                    {{ selectedEvaluation.kind === 'currentBn' ? 'Probation BN' : 'Resigned on standard terms' }}
                </button>
                <button
                    v-if="selectedEvaluation.kind !== 'resignation'"
                    class="btn btn-sm btn-fail"
                    :disabled="selectedEvaluation.consensus == 'fail' || selectedEvaluation.consensus == 'removeFromBn'"
                    @click="setConsensus(selectedEvaluation.kind === 'application' ? 'fail' : 'removeFromBn', $event);"
                >
                    {{ selectedEvaluation.kind === 'application' ? 'Fail' : 'Remove from BN' }}
                </button>
            </span>
        </p>

        <p v-if="selectedEvaluation.kind === 'currentBn' && selectedEvaluation.consensus !== 'probationBn'">
            <b>Addition:</b>
            <span
                class="mr-2"
                :class="consensusColor"
            >
                {{ additionText }}
            </span>
            <span v-if="selectedEvaluation.active">
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
                case undefined:
                    return 'None';
                case 'fullBn':
                    return 'Full BN';
                case 'probationBn':
                    return 'Probation BN';
                case 'removeFromBn':
                    return 'Remove from BN';
                case 'resignedOnGoodTerms':
                    return 'Resigned on good terms';
                case 'resignedOnStandardTerms':
                    return 'Resigned on standard terms';
                default:
                    return consensus;
            }
        },
        additionText() {
            const addition = this.selectedEvaluation.addition;

            switch (addition) {
                case 'lowActivity':
                    return 'Low activity warning';
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
                case 'resignedOnGoodTerms':
                    return 'text-pass';
                case 'fail':
                    return 'text-fail';
                case 'removeFromBn':
                    return 'text-fail';
                case 'probationBn':
                    return 'text-probation';
                case 'resignedOnStandardTerms':
                    return 'text-neutral';
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
