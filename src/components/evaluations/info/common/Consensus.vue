<template>
    <div>
        <p>
            <b>Consensus:</b>
            <span
                v-if="selectedEvaluation.consensus"
                :class="consensusColor"
            >
                {{ consensusText }}
            </span>
            <span v-if="selectedEvaluation.active">
                <button
                    class="btn btn-sm btn-pass ml-2"
                    :disabled="selectedEvaluation.consensus == 'pass' && !selectedEvaluation.isLowActivity"
                    @click="setConsensus('pass', $event);"
                >
                    Pass
                </button>
                <button
                    v-if="!isApplication"
                    class="btn btn-sm btn-probation"
                    :disabled="selectedEvaluation.consensus == 'probation'"
                    @click="setConsensus('probation', $event);"
                >
                    Probation
                </button>
                <button
                    class="btn btn-sm btn-fail"
                    :disabled="selectedEvaluation.consensus == 'fail' && !selectedEvaluation.resignedOnGoodTerms && !selectedEvaluation.resignedOnStandardTerms"
                    @click="setConsensus('fail', $event);"
                >
                    Fail
                </button>
            </span>
        </p>

        <p v-if="selectedEvaluation.active && !isApplication">
            <button
                class="btn btn-sm btn-primary mt-2"
                :disabled="selectedEvaluation.consensus == 'fail' && selectedEvaluation.resignedOnGoodTerms"
                @click="setConsensus('fail', $event, 'resignedOnGoodTerms');"
            >
                Resign on good terms
            </button>
            <button
                class="btn btn-sm btn-primary mt-2"
                :disabled="selectedEvaluation.consensus == 'fail' && selectedEvaluation.resignedOnStandardTerms"
                @click="setConsensus('fail', $event, 'resignedOnStandardTerms');"
            >
                Resign on standard terms
            </button>
            <button
                class="btn btn-sm btn-primary mt-2"
                :disabled="selectedEvaluation.consensus == 'pass' && selectedEvaluation.isLowActivity"
                @click="setConsensus('pass', $event, 'isLowActivity');"
            >
                Low activity warning
            </button>
            <button
                v-if="selectedEvaluation.user.isBn"
                class="btn btn-sm btn-primary mt-2"
                :disabled="selectedEvaluation.isMoveToNat"
                @click="setConsensus('pass', $event, 'isMoveToNat');"
            >
                Move to NAT
            </button>
            <button
                v-else
                class="btn btn-sm btn-primary mt-2"
                :disabled="selectedEvaluation.isMoveToBn"
                @click="setConsensus('pass', $event, 'isMoveToBn');"
            >
                Move to BN
            </button>
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
            if (!this.selectedEvaluation.consensus) {
                return 'none';
            } else if (this.selectedEvaluation.consensus == 'pass') {
                if (this.selectedEvaluation.isLowActivity) {
                    return 'pass + low activity warning';
                } else if (this.selectedEvaluation.isMoveToNat) {
                    return 'pass + move to NAT';
                } else if (this.selectedEvaluation.isMoveToBn) {
                    return 'pass + move to BN';
                } else {
                    return this.selectedEvaluation.consensus;
                }
            } else if (this.selectedEvaluation.resignedOnGoodTerms) {
                return 'fail + resigned on good terms';
            } else if (this.selectedEvaluation.resignedOnStandardTerms) {
                return 'fail + resigned on standard terms';
            } else {
                return this.selectedEvaluation.consensus;
            }
        },
        consensusColor() {
            if (!this.selectedEvaluation.consensus) {
                return '';
            } else {
                return 'text-' + this.selectedEvaluation.consensus;
            }
        },
    },
    methods: {
        async setConsensus(consensus, e, addition) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setConsensus/` + this.selectedEvaluation.id, {
                    consensus,
                    isLowActivity: addition == 'isLowActivity',
                    resignedOnGoodTerms: addition == 'resignedOnGoodTerms',
                    resignedOnStandardTerms: addition == 'resignedOnStandardTerms',
                    isMoveToNat: addition == 'isMoveToNat',
                    isMoveToBn: addition == 'isMoveToBn',
                }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved consensus`,
                    type: 'success',
                });
            }
        },
    },
};
</script>
