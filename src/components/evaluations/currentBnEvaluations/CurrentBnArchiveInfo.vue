<template>
    <div id="currentBnArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="evalRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="evalRound.mode"
                    :nat-evaluators="[]"
                    :is-application="false"
                    :osu-id="evalRound.bn.osuId"
                    :username="evalRound.bn.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <user-activity
                            :osu-id="evalRound.bn.osuId"
                            :mode="evalRound.mode"
                            :deadline="evalRound.deadline"
                            :is-nat="evaluator.isNat"
                            :user-mongo-id="evalRound.bn.id"
                        />
                        <hr>
                        <consensus
                            :consensus="evalRound.consensus"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :is-application="false"
                            :is-low-activity="evalRound.isLowActivity"
                            :is-archive="true"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <p class="min-spacing text-shadow">
                            Current BN Feedback:
                        </p>
                        <pre class="secondary-text pre-font text-shadow small ml-2" v-html="filterLinks(evalRound.feedback)" />
                        <hr v-if="evalRound.consensus">
                        <evaluations
                            :evaluations="evalRound.evaluations"
                            :is-nat="true"
                            :consensus="evalRound.consensus"
                        />
                        <button
                            class="btn btn-sm btn-nat-red float-right"
                            @click="unarchive($event);"
                        >
                            Un-archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';
import postData from '../../../mixins/postData.js';
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'CurrentBnArchiveInfo',
    components: {
        UserActivity,
        ModalHeader,
        Consensus,
        Evaluations,
    },
    mixins: [ filterLinks, postData ],
    props: {
        evalRound: {
            type: Object,
            default: null,
        },
        evaluator: {
            type: Object,
            default: null,
        },
    },
    computed: {
        submittedEvaluators() {
            let evaluators = new Array;
            this.evalRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });
            return evaluators;
        },
    },
    watch: {
        evalRound() {
            history.pushState(null, 'Current BN Evaluations', `/evalarchive?eval=${this.evalRound.id}`);
        },
    },
    methods: {
        async unarchive(e) {
            const result = confirm(`Are you sure? This will place the user on probation`);
            if(result){
                const er = await this.executePost('/evalArchive/unarchive/' + this.evalRound.id, { type: 'evalRound' }, e);
                if (er) {
                    window.location = '/bnEval?eval=' + this.evalRound.id;
                }
            }
        },
    },
};
</script>

<style>

</style>