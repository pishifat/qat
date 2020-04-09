<template>
    <div id="applicationDiscussionInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="application" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="application.mode"
                    :nat-evaluators="application.natEvaluators"
                    :is-application="true"
                    :osu-id="application.applicant.osuId"
                    :username="application.applicant.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="application.mods"
                            :reasons="application.reasons"
                            :osu-id="application.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="application.test.totalScore"
                            :osu-id="application.applicant.osuId"
                        />
                        <div v-if="evaluator.isNat">
                            <p class="text-shadow">
                                <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
                            </p>
                            <div id="additionalInfo" class="collapse container">
                                <applicant-comment
                                    v-if="application.test.comment"
                                    :comment="application.test.comment"
                                />
                                <previous-evaluations
                                    :user-mongo-id="application.applicant.id"
                                />
                                <user-notes
                                    :user-mongo-id="application.applicant.id"
                                />
                            </div>
                        </div>
                        <hr>
                        <consensus
                            v-if="evaluator.isNat"
                            :consensus="application.consensus"
                            :nominator-assessment-mongo-id="application.id"
                            :is-application="true"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <cooldown
                            v-if="application.consensus == 'fail' && evaluator.isNat"
                            :cooldown-date="application.cooldownDate"
                            :origin-date="application.createdAt"
                            :nominator-assessment-mongo-id="application.id"
                            :is-application="true"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <feedback-info
                            v-if="application.consensus && evaluator.isNat"
                            :consensus="application.consensus"
                            :is-application="true"
                            :osu-id="application.applicant.osuId"
                            :cooldown-date="application.cooldownDate"
                            :evaluations="application.evaluations"
                            :mode="application.mode"
                            :saved-feedback="application.feedback"
                            :nominator-assessment-mongo-id="application.id"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <hr v-if="application.consensus && evaluator.isNat">
                        <evaluations
                            v-if="evaluator.isNat || application.consensus"
                            :is-nat="evaluator.isNat"
                            :consensus="application.consensus"
                            :evaluations="application.evaluations"
                            :user-id="evaluator.id"
                        />
                        <p v-else class="text-shadow small">
                            No consensus has been set, so evaluations are not visible. Check back later!
                        </p>
                        <evaluation-input
                            v-if="evaluator.isNat"
                            :is-application="true"
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
import ApplicantComment from './applicationInfo/ApplicantComment.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';
import EvaluationInput from '../info/EvaluationInput.vue';

export default {
    name: 'ApplicationDiscussionInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        ApplicantComment,
        PreviousEvaluations,
        UserNotes,
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
        EvaluationInput,
    },
    props: {
        application: {
            type: Object,
            required: true,
        },
        evaluator: {
            type: Object,
            required: true,
        },
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