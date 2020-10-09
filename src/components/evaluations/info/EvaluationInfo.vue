<template>
    <modal-dialog
        id="evaluationInfo"
        modal-size="xl"
    >
        <template v-if="selectedEvaluation" #header>
            <modal-header
                :mode="selectedEvaluation.mode"
                :nat-evaluators="selectedEvaluation.natEvaluators || []"
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
            />
            <template v-if="loggedInUser.isNat">
                <p>
                    <a href="#additionalInfo" data-toggle="collapse">
                        Additional info <i class="fas fa-angle-down" />
                    </a>
                </p>

                <div id="additionalInfo" class="collapse container">
                    <previous-evaluations
                        :user-mongo-id="selectedEvaluation.user.id"
                    />
                    <user-notes
                        :user-mongo-id="selectedEvaluation.user.id"
                    />
                    <user-reports
                        :user-mongo-id="selectedEvaluation.user.id"
                    />
                    <modding-activity
                        :username="selectedEvaluation.user.username"
                    />
                    <evaluator-assignments />
                </div>
            </template>

            <discussion-info v-if="selectedEvaluation.discussion" />

            <!-- Only NAT can edit their review while in discussion -->
            <template v-if="!selectedEvaluation.discussion || (selectedEvaluation.discussion && loggedInUser.isNat)">
                <hr>
                <evaluation-input />
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
        UserActivity,
        EvaluationInput,
        EvaluatorAssignments,
        ModalDialog,
        MainApplicationInfo,
        DiscussionInfo,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        modes () {
            if (!this.selectedEvaluation) return [];
            if (this.selectedEvaluation.user.modes.length) return this.selectedEvaluation.user.modes;

            return this.selectedEvaluation.mode;
        },
    },
};
</script>
