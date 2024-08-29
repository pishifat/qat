<template>
    <modal-dialog
        id="extendedInfo"
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
                :is-nat="selectedEvaluation.user.isNat"
            />

            <evaluation-visibility v-if="selectedEvaluation.kind ==='currentBn' && !isNatEvaluation" />

            <evaluation-link />

            <consensus />

            <div v-if="selectedEvaluation.isApplication && selectedEvaluation.consensus == 'pass' && selectedEvaluation.natBuddy">
                <p>
                    <b>NAT Buddy:</b>
                    <user-link
                        :class="selectedEvaluation.natBuddy.groups.includes('nat') ? 'text-nat' : selectedEvaluation.natBuddy.groups.includes('bn') ? 'text-probation' : ''"
                        :osu-id="selectedEvaluation.natBuddy.osuId"
                        :username="selectedEvaluation.natBuddy.username"
                    />
                </p>
            </div>

            <div v-if="!selectedEvaluation.isResignation && selectedEvaluation.feedback && selectedEvaluation.feedback !== 'None'">

                <p>
                    <b>Feedback:</b>
                </p>

                <div v-if="selectedEvaluation.feedback" class="card card-body small v-html-content" v-html="$md.render(selectedEvaluation.feedback)" />

            </div>

            <div v-if="selectedEvaluation.evaluators && selectedEvaluation.evaluators.length">
                <p class="mt-2">
                    <b>Evaluators:</b>
                </p>
                <div class="card card-body">
                    <ul class="mb-0">
                        <li v-for="user in selectedEvaluation.evaluators" :key="user.osuIid">
                            <user-link
                                :class="user.groups.includes('nat') ? 'text-nat' : user.groups.includes('bn') ? 'text-probation' : ''"
                                :osu-id="user.osuId"
                                :username="user.username"
                            />
                        </li>
                    </ul>
                </div>
            </div>

            <hr>
            <reviews-listing 
                v-if="loggedInUser && loggedInUser.isNatLeader || !isNatEvaluation"
            />

            <evaluation-messages
                v-if="loggedInUser"
                :evaluation="selectedEvaluation"
                :is-new-evaluation-format="selectedEvaluation.isNewEvaluationFormat"
            />

            <debug-view-document 
                v-if="loggedInUser && loggedInUser.isAdmin"
                :document="selectedEvaluation"
            />
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
import EvaluationLink from './common/EvaluationLink.vue';
import UserLink from '../../UserLink.vue';
import EvaluationVisibility from './common/EvaluationVisibility.vue';
import EvaluationMessages from './common/EvaluationMessages.vue';
import DebugViewDocument from '../../DebugViewDocument.vue';

export default {
    name: 'PublicEvalsInfo',
    components: {
        ModalHeader,
        Consensus,
        ReviewsListing,
        UserActivity,
        ModalDialog,
        MainApplicationInfo,
        EvaluationLink,
        UserLink,
        EvaluationVisibility,
        EvaluationMessages,
        DebugViewDocument,
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
            
            if (this.selectedEvaluation.user.modes.length && !this.selectedEvaluation.user.modes.includes('none'))
                return this.selectedEvaluation.user.modes;

            return [this.selectedEvaluation.mode];
        },
        isNatEvaluation () {
            return ['remainInNat', 'moveToBn', 'removeFromNat'].includes(this.selectedEvaluation.consensus);
        },
    },
};
</script>
