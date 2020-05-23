<template>
    <div id="currentBnIndividualInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedIndividualRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="selectedIndividualRound.mode"
                    :nat-evaluators="selectedIndividualRound.natEvaluators || []"
                    :osu-id="selectedIndividualRound.bn.osuId"
                    :username="selectedIndividualRound.bn.username"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <p class="text-shadow min-spacing mb-1">
                            Recent BN activity
                        </p>
                        <div class="container mb-3">
                            <user-activity
                                :osu-id="selectedIndividualRound.bn.osuId"
                                :modes="modes"
                                :deadline="selectedIndividualRound.deadline"
                                :mongo-id="selectedIndividualRound.bn.id"
                            />
                        </div>
                    </div>
                    <div class="container">
                        <p class="text-shadow">
                            <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
                        </p>
                        <div id="additionalInfo" class="collapse container">
                            <previous-evaluations
                                :user-mongo-id="selectedIndividualRound.bn.id"
                            />
                            <user-notes
                                :user-mongo-id="selectedIndividualRound.bn.id"
                            />
                            <user-reports
                                :user-mongo-id="selectedIndividualRound.bn.id"
                            />
                            <modding-activity
                                :username="selectedIndividualRound.bn.username"
                            />
                            <user-list
                                v-if="selectedIndividualRound.evaluations.length"
                                :header="'Total evaluations: (' + selectedIndividualRound.evaluations.length + ')'"
                                :user-list="submittedEvaluators"
                            />
                            <evaluator-assignments
                                :nat-evaluators="selectedIndividualRound.natEvaluators"
                                :evaluations="selectedIndividualRound.evaluations"
                                :mode="selectedIndividualRound.mode"
                                :osu-id="selectedIndividualRound.bn.osuId"
                                :username="selectedIndividualRound.bn.username"
                                :nominator-assessment-mongo-id="selectedIndividualRound.id"
                            />
                        </div>
                        <hr>
                        <evaluation-input
                            :nominator-assessment-mongo-id="selectedIndividualRound.id"
                            :evaluations="selectedIndividualRound.evaluations"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import UserReports from './currentBnInfo/UserReports.vue';
import ModdingActivity from './currentBnInfo/ModdingActivity.vue';
import UserList from '../info/UserList.vue';
import EvaluationInput from '../info/EvaluationInput.vue';
import EvaluatorAssignments from '../info/EvaluatorAssignments.vue';

export default {
    name: 'CurrentBnIndividualInfo',
    components: {
        UserActivity,
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        UserList,
        EvaluationInput,
        EvaluatorAssignments,
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedIndividualRound',
        ]),
        submittedEvaluators() {
            let evaluators = new Array;
            this.selectedIndividualRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });

            return evaluators;
        },
        modes() {
            let modes = [];
            if (this.selectedIndividualRound.bn.modes.length) modes = this.selectedIndividualRound.bn.modes;
            else modes.push(this.selectedIndividualRound.mode);

            return modes;
        },
    },
    watch: {
        selectedIndividualRound() {
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.selectedIndividualRound.id}`);
        },
    },
};
</script>
