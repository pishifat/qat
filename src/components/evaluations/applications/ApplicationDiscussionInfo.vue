<template>
    <div id="applicationDiscussionInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="application" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="application.mode"
                    :nat-evaluators="application.natEvaluators"
                    :isApplication="true"
                    :osuId="application.applicant.osuId"
                    :username="application.applicant.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="application.mods"
                            :osuId="application.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="application.test.totalScore"
                            :osuId="application.applicant.osuId"
                        />
                        <p class="text-shadow">
                            <a href="#additionalInfo" data-toggle="collapse">Additional Info <i class="fas fa-angle-down" /></a>
                        </p>
                        <div id="additionalInfo" class="collapse container">
                            <p v-if="application.test.comment" class="text-shadow">
                                Applicant comment: <span class="small">{{ application.test.comment }}</span>
                            </p>
                            <previous-evaluations
                                :user-mongo-id="application.applicant.id"
                            />
                            <user-notes
                                :user-mongo-id="application.applicant.id"
                            />
                        </div>
                        <hr>
                        <consensus
                            :consensus="application.consensus"
                            :nominator-assessment-mongo-id="application.id"
                            :is-application="true"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <cooldown
                            v-if="application.consensus == 'fail'"
                            :cooldown-date="application.cooldownDate"
                            :originDate="application.createdAt"
                            :nominator-assessment-mongo-id="application.id"
                            :is-application="true"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <feedback-info
                            v-if="application.consensus"
                            :consensus="application.consensus"
                            :is-application="true"
                            :osu-id="application.applicant.osuId"
                            :date="application.createdAt"
                            :evaluations="application.evaluations"
                            :mode="application.mode"
                            :saved-feedback="application.feedback"
                            :nominator-assessment-mongo-id="application.id"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <hr v-if="application.consensus">
                        <evaluations
                            :evaluations="application.evaluations"
                        />
                        <evaluation-input
                            :isApplication="true"
                            :nominator-assessment-mongo-id="application.id"
                            :evaluator-mongo-id="evaluator.id"
                            :evaluations="application.evaluations"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';
import EvaluationInput from '../info/EvaluationInput.vue';

export default {
    name: 'application-discussion-info',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        PreviousEvaluations,
        UserNotes,
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
        EvaluationInput
    },
    props: {
        application: Object,
        evaluator: Object,
    },
    watch: {
        application() {
            history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.application.id}`);
        },
    },
};
</script>

<style>

.eval-bg-priority {
    background-color: rgb(38, 48, 63)!important;
    box-shadow: 5px 5px 5px 5px rgb(38, 48, 63);
}

</style>