<template>
    <div id="applicationIndividualInfo" class="modal fade" tabindex="-1">
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
                        <div v-if="evaluator.isNat">
                            <p class="text-shadow">
                                <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
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
                               <evaluator-assignments
                                    :bn-evaluators="application.bnEvaluators"
                                    :nat-evaluators="application.natEvaluators"
                                    :evaluations="application.evaluations"
                                    :isLeader="evaluator.isLeader"
                                    :mode="application.mode"
                                    :osuId="application.applicant.osuId"
                                    :username="application.applicant.username"
                                    :application-id="application.id"
                                    @update-application="$emit('update-application', $event);"
                               />
                            </div>
                        </div>
                        <hr>
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
import EvaluatorAssignments from './applicationInfo/EvaluatorAssignments.vue';
import EvaluationInput from '../info/EvaluationInput.vue';

export default {
    name: 'application-individual-info',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        PreviousEvaluations,
        UserNotes,
        EvaluatorAssignments,
        EvaluationInput,
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

</style>