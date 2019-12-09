<template>
    <p class="text-shadow">
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
                class="btn btn-sm btn-nat-green"
                :disabled="consensus == 'pass' && isLowActivity"
                @click="setConsensus('pass', $event, true);"
            >
                Pass + activity warning
            </button>
            <button
                v-if="!isApplication"
                class="btn btn-sm btn-nat-blue"
                :disabled="consensus == 'extend' "
                @click="setConsensus('extend', $event);"
            >
                Probation
            </button>
            <button
                class="btn btn-sm btn-nat-red"
                :disabled="consensus == 'fail'"
                @click="setConsensus('fail', $event);"
            >
                Fail
            </button>
        </span>
    </p>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'consensus',
    props: {
        consensus: String,
        nominatorAssessmentMongoId: String,
        isApplication: Boolean,
        isLowActivity: Boolean,
        isArchive: Boolean,
    },
    mixins: [ postData ],
    computed: {
        consensusText() {
            if(!this.consensus){
                return 'none';
            }else if(this.consensus == 'extend'){
                return 'probation';
            }else if(this.consensus == 'pass' && this.isLowActivity){
                return 'pass + activity warning';
            }else{
                return this.consensus;
            }
        },
        consensusColor() {
            if(!this.consensus){
                return '';
            }else if(this.consensus == 'extend'){
                return 'vote-neutral';
            }else{
                return 'vote-' + this.consensus;
            }
        }
    },
    methods: {
        async setConsensus(consensus, e, toggle){
            const result = await this.executePost(
                `/${this.isApplication? 'appEval' : 'bnEval'}/setConsensus/` + this.nominatorAssessmentMongoId, { consensus, isLowActivity: toggle }, e);
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    await this.$emit('update-nominator-assessment', result);
                }
            }
        },
    },
};
</script>