<template>
    <modal-dialog
        id="yourEvalsInfo"
        modal-size="xl"
    >
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
                :overwrite-days="selectedEvaluation.activityToCheck ? selectedEvaluation.activityToCheck + 7 : 90 + 7"
            />

            <consensus />

            <p>
                <b>Feedback:</b>
            </p>

            <div v-if="selectedEvaluation.feedback" class="card card-body small" v-html="$md.render(selectedEvaluation.feedback)" />

            <div v-if="loggedInUser && loggedInUser.isNat">
                <hr>
                <reviews-listing />
            </div>

        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import Consensus from './common/Consensus.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import UserActivity from './currentBns/userActivity/UserActivity.vue';
import ModalDialog from '../../ModalDialog.vue';
import MainApplicationInfo from './applications/MainApplicationInfo.vue';

export default {
    name: 'YourEvalsInfo',
    components: {
        ModalHeader,
        Consensus,
        ReviewsListing,
        UserActivity,
        ModalDialog,
        MainApplicationInfo,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string | string[]} */
        modes () {
            if (!this.selectedEvaluation) return [];
            if (this.selectedEvaluation.user.modes.length) return this.selectedEvaluation.user.modes;

            return this.selectedEvaluation.mode;
        },
    },
};
</script>
