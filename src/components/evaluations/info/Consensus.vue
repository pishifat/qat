<template>
    <div class="text-shadow">
        <p>
            Consensus:
            <span
                v-if="consensus"
                :class="consensusColor"
            >
                {{ consensusText }}
            </span>
            <span v-if="!isArchive">
                <button
                    class="btn btn-sm btn-nat-green ml-2"
                    :disabled="consensus == 'pass' && !isLowActivity"
                    @click="setConsensus('pass', $event);"
                >
                    Pass
                </button>
                <button
                    v-if="!isApplication"
                    class="btn btn-sm btn-nat-blue"
                    :disabled="consensus == 'probation' "
                    @click="setConsensus('probation', $event);"
                >
                    Probation
                </button>
                <button
                    class="btn btn-sm btn-nat-red"
                    :disabled="consensus == 'fail' && !resignedOnGoodTerms"
                    @click="setConsensus('fail', $event);"
                >
                    Fail
                </button>
            </span>
        </p>
        <p v-if="!isArchive && !isApplication">
            <button
                class="btn btn-xs btn-nat-green"
                :disabled="consensus == 'pass' && isLowActivity"
                @click="setConsensus('pass', $event, true);"
            >
                Pass + activity warning
            </button>
            <button
                class="btn btn-xs btn-nat-red"
                :disabled="consensus == 'fail' && resignedOnGoodTerms"
                @click="setConsensus('fail', $event, false, true);"
            >
                Fail + resign on good terms
            </button>
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'Consensus',
    mixins: [ postData ],
    props: {
        consensus: {
            type: String,
            default: null,
        },
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
        isLowActivity: Boolean,
        resignedOnGoodTerms: Boolean,
        isArchive: Boolean,
    },
    computed: {
        consensusText() {
            if (!this.consensus) {
                return 'none';
            } else if (this.consensus == 'pass' && this.isLowActivity) {
                return 'pass + activity warning';
            } else if (this.consensus == 'fail' && this.resignedOnGoodTerms) {
                return 'fail + resigned on good terms';
            } else {
                return this.consensus;
            }
        },
        consensusColor() {
            if (!this.consensus) {
                return '';
            } else {
                return 'vote-' + this.consensus;
            }
        },
    },
    methods: {
        async setConsensus(consensus, e, isLowActivity, resignedOnGoodTerms) {
            const result = await this.executePost(
                `/${this.isApplication? 'appEval' : 'bnEval'}/setConsensus/` + this.nominatorAssessmentMongoId, { consensus, isLowActivity, resignedOnGoodTerms }, e);

            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-nominator-assessment', result);
                }
            }
        },
    },
};
</script>