<template>
    <modal-dialog id="evaluationInfo" modal-size="xl">
        <template v-if="selectedEvaluation" #header>
            <modal-header
                :mode="selectedEvaluation.mode"
                :nat-evaluators="selectedEvaluation.natEvaluators || []"
                :bn-evaluators="selectedEvaluation.bnEvaluators || []"
                :osu-id="selectedEvaluation.user.osuId"
                :username="selectedEvaluation.user.username"
                :is-application="selectedEvaluation.isApplication"
                :is-bn-evaluation="selectedEvaluation.isBnEvaluation"
            />
        </template>

        <div v-if="selectedEvaluation" class="container">
            <main-application-info v-if="selectedEvaluation.isApplication" />

            <user-activity
                v-else
                :osu-id="selectedEvaluation.user.osuId"
                :modes="modes"
                :deadline="selectedEvaluation.deadline"
                :mongo-id="selectedEvaluation.user.id"
                :unique="selectedEvaluation.id"
                :overwrite-days="
                    selectedEvaluation.activityToCheck
                        ? selectedEvaluation.activityToCheck + 7
                        : 90 + 7
                "
                :is-evaluation="true"
                :is-nat="selectedEvaluation.user.isNat"
            />
            <template v-if="loggedInUser.isNat || loggedInUser.isTrialNat">
                <p>
                    <a href="#additionalInfo" data-toggle="collapse">
                        Additional info <i class="fas fa-angle-down" />
                    </a>
                </p>

                <div id="additionalInfo" class="collapse container">
                    <evaluator-assignments />
                    <previous-evaluations
                        :user-mongo-id="selectedEvaluation.user.id"
                    />
                    <user-notes :user-mongo-id="selectedEvaluation.user.id" />
                    <user-reports
                        v-if="loggedInUser.isNat"
                        :user-mongo-id="selectedEvaluation.user.id"
                    />
                    <modding-activity
                        :username="selectedEvaluation.user.username"
                    />
                    <div v-if="loggedInUser.isPishifat" class="mb-2">
                        <b>Debug</b>
                        <div class="ml-4">
                            <a href="#evalDocument" data-toggle="collapse">
                                view evaluation document <i class="fas fa-angle-down" />
                            </a>
                            <pre id="evalDocument" class="collapse container text-white">{{ JSON.stringify(selectedEvaluation, null, 4) }}</pre>
                        </div>
                    </div>
                </div>
            </template>

            <discussion-info v-if="selectedEvaluation.discussion && (selectedEvaluation.isApplication || !selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode))" />

            <template v-if="selectedEvaluation.active">
                <hr />
                <evaluation-input v-if="selectedEvaluation.isApplication || (!selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) && !selectedEvaluation.user.modes.includes('none'))" />
                <nat-self-evaluation v-else-if="!selectedEvaluation.discussion && selectedEvaluation.user.id == loggedInUser.id && (selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) || selectedEvaluation.user.modes.includes('none'))" />
                <nat-leader-evaluation v-else-if="selectedEvaluation.discussion && loggedInUser.isNatLeader && (selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) || selectedEvaluation.user.modes.includes('none'))" />
                <div v-else>
                    There's nothing for you to do here. :)
                </div>
            </template>
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import PreviousEvaluations from './common/PreviousEvaluations.vue';
import UserNotes from './common/UserNotes.vue';
import UserReports from './currentBns/UserReports.vue';
import ModdingActivity from './currentBns/ModdingActivity.vue';
import NatSelfEvaluation from './currentBns/NatSelfEvaluation.vue';
import NatLeaderEvaluation from './currentBns/NatLeaderEvaluation.vue';
import UserActivity from './currentBns/userActivity/UserActivity.vue';
import EvaluationInput from './common/EvaluationInput.vue';
import EvaluatorAssignments from './common/EvaluatorAssignments.vue';
import ModalDialog from '../../ModalDialog.vue';
import MainApplicationInfo from './applications/MainApplicationInfo.vue';
import DiscussionInfo from './DiscussionInfo.vue';

export default {
    name: 'EvaluationInfo',
    components: {
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        NatSelfEvaluation,
        NatLeaderEvaluation,
        UserActivity,
        EvaluationInput,
        EvaluatorAssignments,
        ModalDialog,
        MainApplicationInfo,
        DiscussionInfo,
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('evaluations', ['selectedEvaluation']),
        modes() {
            if (!this.selectedEvaluation) return [];
            if (this.selectedEvaluation.user.modes.length)
                return this.selectedEvaluation.user.modes;

            return this.selectedEvaluation.mode;
        },
    },
};
</script>
