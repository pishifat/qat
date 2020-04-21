<template>
    <div id="currentBnIndividualInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="evalRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="evalRound.mode"
                    :nat-evaluators="evalRound.natEvaluators || []"
                    :is-application="false"
                    :osu-id="evalRound.bn.osuId"
                    :username="evalRound.bn.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div v-for="(mode, i) in modes" :key="mode" class="container">
                        <p class="text-shadow min-spacing mb-1">
                            Recent BN activity
                            <span class="small">({{ mode == 'osu' ? 'osu!' : 'osu!' + mode }})</span>
                        </p>
                        <div class="container mb-3">
                            <user-activity
                                :osu-id="evalRound.bn.osuId"
                                :mode="modes[i]"
                                :deadline="evalRound.deadline"
                                :is-nat="evaluator.isNat"
                                :user-mongo-id="evalRound.bn.id"
                            />
                        </div>
                    </div>
                    <div class="container">
                        <p class="text-shadow">
                            <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
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
                                :user-list="submittedEvaluators"
                            />
                            <evaluator-assignments
                                :nat-evaluators="evalRound.natEvaluators"
                                :evaluations="evalRound.evaluations"
                                :mode="evalRound.mode"
                                :osu-id="evalRound.bn.osuId"
                                :username="evalRound.bn.username"
                                :nominator-assessment-mongo-id="evalRound.id"
                                @update-nominator-assessment="$emit('update-eval-round', $event);"
                            />
                        </div>
                        <hr>
                        <evaluation-input
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
        modes() {
            let modes = [];
            if (this.evalRound.bn.modes.length) modes = this.evalRound.bn.modes;
            else modes.push(this.evalRound.mode);

            return modes;
        },
    },
    watch: {
        evalRound() {
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.evalRound.id}`);
        },
    },
    created() {
        history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.evalRound.id}`);
    },
};
</script>

<style>

</style>