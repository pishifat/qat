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
                </div>
            </template>

            <discussion-info v-if="selectedEvaluation.discussion && !selectedEvaluation.user.isNat" />

            <template v-if="selectedEvaluation.active">
                <hr />
                <evaluation-input v-if="!selectedEvaluation.user.isNat" />
                <nat-self-evaluation v-else-if="selectedEvaluation.user.isNat && selectedEvaluation.user.id == loggedInUser.id && !selectedEvaluation.discussion" />
                <nat-leader-evaluation v-else-if="selectedEvaluation.user.isNat && selectedEvaluation.discussion && loggedInUser.isNatLeader" />
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
