<template>
    <div id="currentBnDiscussionInfo" class="modal fade" tabindex="-1">
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
                        <p class="text-shadow">
                            <a href="#additionalInfo" data-toggle="collapse">Additional Info <i class="fas fa-angle-down" /></a> 
                        </p>
                        <div id="additionalInfo" class="collapse container">
                            <previous-evaluations
                                :user-mongo-id="evalRound.bn.id"
                            />
                            <user-notes
                                :user-mongo-id="evalRound.bn.id"
                            />
                            <user-reports
                                :user-mongo-id="evalRound.bn.id"
                            />
                            <modding-activity
                                :username="evalRound.bn.username"
                            />
                            <user-list
                                v-if="evalRound.evaluations.length"
                                :header="'Total evaluations: (' + evalRound.evaluations.length + ')'"
                                :userList="submittedEvaluators"
                            />
                        </div>
                        <hr>
                        <consensus
                            :consensus="evalRound.consensus"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :is-application="false"
                            :is-low-activity="evalRound.isLowActivity"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <cooldown
                            v-if="evalRound.consensus == 'fail'"
                            :cooldown-date="evalRound.cooldownDate"
                            :originDate="evalRound.updatedAt"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :is-application="false"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <feedback-info
                            v-if="evalRound.consensus"
                            :consensus="evalRound.consensus"
                            :osu-id="evalRound.bn.osuId"
                            :cooldown-date="evalRound.cooldownDate"
                            :evaluations="evalRound.evaluations"
                            :probation="evalRound.bn.probation"
                            :is-low-activity="evalRound.isLowActivity"
                            :mode="evalRound.mode"
                            :saved-feedback="evalRound.feedback"
                            :nominator-assessment-mongo-id="evalRound.id"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <hr v-if="evalRound.consensus">
                        <evaluations
                            :evaluations="evalRound.evaluations"
                        />
                        <evaluation-input
                            :isApplication="false"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :evaluator-mongo-id="evaluator.id"
                            :evaluations="evalRound.evaluations"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import UserReports from './currentBnInfo/UserReports.vue';
import ModdingActivity from './currentBnInfo/ModdingActivity.vue';
import UserList from '../info/UserList.vue';
import EvaluationInput from '../info/EvaluationInput.vue';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'current-bn-discussion-info',
    components: {
        UserActivity,
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        UserList,
        EvaluationInput,
        Consensus,
        Cooldown, 
        FeedbackInfo,
        Evaluations,
    },
    props: {
        evalRound: Object,
        evaluator: Object,
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
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.evalRound.id}`);
        },
    }
    
};
</script>

<style>

</style>