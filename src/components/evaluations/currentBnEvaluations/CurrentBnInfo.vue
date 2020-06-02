<template>
    <modal-dialog modal-size="xl">
        <template v-if="evaluation" #header>
            <modal-header
                :mode="evaluation.mode"
                :nat-evaluators="evaluation.natEvaluators || []"
                :osu-id="evaluation.bn.osuId"
                :username="evaluation.bn.username"
            />
        </template>

        <div v-if="evaluation" class="container">
            <p>
                <b>Recent BN activity</b>
            </p>

            <user-activity
                :osu-id="evaluation.bn.osuId"
                :modes="modes"
                :deadline="evaluation.deadline"
                :mongo-id="evaluation.bn.id"
            />

            <p>
                <a href="#additionalInfo" data-toggle="collapse">
                    Additional info <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="additionalInfo" class="collapse container">
                <previous-evaluations
                    :user-mongo-id="evaluation.bn.id"
                />
                <user-notes
                    :user-mongo-id="evaluation.bn.id"
                />
                <user-reports
                    :user-mongo-id="evaluation.bn.id"
                />
                <modding-activity
                    :username="evaluation.bn.username"
                />
                <slot name="additional-info" />
            </div>

            <hr>

            <slot name="actions" />

            <evaluation-input
                :nominator-assessment-mongo-id="evaluation.id"
                :evaluations="evaluation.evaluations"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import UserReports from './currentBnInfo/UserReports.vue';
import ModdingActivity from './currentBnInfo/ModdingActivity.vue';
import EvaluationInput from '../info/EvaluationInput.vue';
import ModalDialog from '../../ModalDialog.vue';

export default {
    name: 'CurrentBnInfo',
    components: {
        UserActivity,
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        EvaluationInput,
        ModalDialog,
    },
    props: {
        evaluation: {
            type: Object,
            default: undefined,
        },
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        modes () {
            if (!this.evaluation) return [];
            if (this.evaluation.bn.modes.length) return this.evaluation.bn.modes;

            return this.evaluation.mode;
        },
    },
};
</script>
