<template>
    <div id="applicationIndividualInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedIndividualApplication" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="selectedIndividualApplication.mode"
                    :nat-evaluators="selectedIndividualApplication.natEvaluators"
                    :is-application="true"
                    :osu-id="selectedIndividualApplication.applicant.osuId"
                    :username="selectedIndividualApplication.applicant.username"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="selectedIndividualApplication.mods"
                            :reasons="selectedIndividualApplication.reasons"
                            :osu-id="selectedIndividualApplication.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="selectedIndividualApplication.test.totalScore"
                            :osu-id="selectedIndividualApplication.applicant.osuId"
                        />
                        <div v-if="evaluator.isNat">
                            <p class="text-shadow">
                                <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
                            </p>
                            <div id="additionalInfo" class="collapse container">
                                <applicant-comment
                                    v-if="selectedIndividualApplication.test.comment"
                                    :comment="selectedIndividualApplication.test.comment"
                                />
                                <previous-evaluations
                                    :user-mongo-id="selectedIndividualApplication.applicant.id"
                                />
                                <user-notes
                                    :user-mongo-id="selectedIndividualApplication.applicant.id"
                                />
                                <evaluator-assignments
                                    :bn-evaluators="selectedIndividualApplication.bnEvaluators"
                                    :nat-evaluators="selectedIndividualApplication.natEvaluators"
                                    :evaluations="selectedIndividualApplication.evaluations"
                                    :mode="selectedIndividualApplication.mode"
                                    :osu-id="selectedIndividualApplication.applicant.osuId"
                                    :username="selectedIndividualApplication.applicant.username"
                                    :nominator-assessment-mongo-id="selectedIndividualApplication.id"
                                    :is-application="true"
                                />
                            </div>
                        </div>
                        <hr>
                        <evaluation-input
                            :is-application="true"
                            :nominator-assessment-mongo-id="selectedIndividualApplication.id"
                            :evaluations="selectedIndividualApplication.evaluations"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
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
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedIndividualApplication',
        ]),
    },
    watch: {
        selectedIndividualApplication() {
            history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.selectedIndividualApplication.id}`);
        },
    },
};
</script>

<style>

</style>