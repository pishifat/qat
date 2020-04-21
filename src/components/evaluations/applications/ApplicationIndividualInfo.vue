<template>
    <div id="applicationIndividualInfo" class="modal fade" tabindex="-1">
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
                                <evaluator-assignments
                                    :bn-evaluators="application.bnEvaluators"
                                    :nat-evaluators="application.natEvaluators"
                                    :evaluations="application.evaluations"
                                    :mode="application.mode"
                                    :osu-id="application.applicant.osuId"
                                    :username="application.applicant.username"
                                    :nominator-assessment-mongo-id="application.id"
                                    :is-application="true"
                                    @update-nominator-assessment="$emit('update-application', $event);"
                                />
                            </div>
                        </div>
                        <hr>
                        <evaluation-input
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
import EvaluatorAssignments from '../info/EvaluatorAssignments.vue';
import EvaluationInput from '../info/EvaluationInput.vue';

export default {
    name: 'ApplicationIndividualInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        ApplicantComment,
        PreviousEvaluations,
        UserNotes,
        EvaluatorAssignments,
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
    created() {
        history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.application.id}`);
    },
};
</script>

<style>

</style>