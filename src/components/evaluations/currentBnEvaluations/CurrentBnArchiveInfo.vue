<template>
    <div id="currentBnArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="evalRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="evalRound.mode"
                    :nat-evaluators="[]"
                    :isApplication="false"
                    :osuId="evalRound.bn.osuId"
                    :username="evalRound.bn.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <user-activity
                            :eval-round="evalRound"
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
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'current-bn-archive-info',
    components: {
        UserActivity,
        ModalHeader,
        Consensus,
        Evaluations,
    },
    props: {
        evalRound: Object,
        evaluator: Object,
    },
    mixins: [ filterLinks ],
    computed: {
        submittedEvaluators() {
            let evaluators = new Array;
            this.evalRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });
            return evaluators;
        },
    },
    evalRound() {
        history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.evalRound.id}`);
    },
};
</script>

<style>

</style>