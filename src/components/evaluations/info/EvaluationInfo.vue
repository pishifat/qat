<template>
    <modal-dialog id="evaluationInfo" modal-size="xl" :document-title="documentTitle">
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
            <div v-if="selectedEvaluation.isApplication && selectedEvaluation.active && !selectedEvaluation.discussion && !evaluatorVibeChecked()">
                <b>Pre-evaluation:</b>
                <div class="small ms-4">
                    Based on what you currently know about this user, would you pass or fail their application?
                </div>
                <div class="small ms-4">
                    Feel free to look at the <a :href="`https://osu.ppy.sh/users/${selectedEvaluation.user.osuId}`" target="_blank">user's profile</a>, but do not research their mods yet.
                </div>
                <div class="small ms-4 mt-2">
                    Your vote will not be shown to the applicant (or anyone else). This only exists to gather fun stats.
                </div>
                <div class="d-flex flex-wrap align-items-center justify-content-end">
                    <div class="form-check form-check-inline">
                        <input
                            id="1"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="1"
                        >
                        <label class="form-check-label text-pass" for="1">Pass</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input
                            id="3"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="3"
                        >
                        <label class="form-check-label text-fail" for="3">Fail</label>
                    </div>

                    <button class="btn btn-sm btn-primary" @click="submitVibeCheck($event)">
                        Submit vibes
                    </button>
                </div>
            </div>

            <div v-else>
                <div v-if="selectedEvaluation.isApplication">
                    <main-application-info />
                    <evaluation-is-security-checked v-if="loggedInUser.isNat" class="mb-2" />
                </div>

                <div v-else>
                    <risk-card
                        v-if="showRiskUi"
                        :result="riskResult"
                        :loading="riskLoading"
                        :can-refresh="Boolean(selectedEvaluation.active)"
                        @refresh="refreshRisk"
                    />
                    <user-activity
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
                        :is-nat="isNatEval"
                        :user="selectedEvaluation.user"
                        :show-activity-standing="true"
                    />
                    <applicant-comment
                        v-if="selectedEvaluation.isResignation && selectedEvaluation.comment"
                        :comment="selectedEvaluation.comment"
                        label="Comment"
                    />
                </div>

                <evaluation-link />

                <hr>

                <penalty-history
                    v-if="showRiskUi"
                    :user-id="selectedEvaluation.user.id"
                    :modes="[selectedEvaluation.mode]"
                    :lock-mode="true"
                    :initial-mode="selectedEvaluation.mode"
                    :can-create="Boolean(loggedInUser.isNat || loggedInUser.isTrialNat)"
                    :refresh-nonce="penaltyNonce"
                    @changed="onPenaltyChanged"
                />

                <hr>

                <template v-if="loggedInUser.isNat || loggedInUser.isTrialNat">
                    <p>
                        <a href="#additionalInfo" data-bs-toggle="collapse">
                            Additional info <i class="fas fa-angle-down" />
                        </a>
                    </p>

                    <div id="additionalInfo" class="collapse container mb-4">
                        <evaluator-assignments />
                        <assignment-history v-if="loggedInUser.isNatLeader && selectedEvaluation.rerolls && selectedEvaluation.rerolls.length" />
                        <hr>
                        <user-notes :user-mongo-id="selectedEvaluation.user.id" />
                        <hr>
                        <previous-evaluations
                            :user-mongo-id="selectedEvaluation.user.id"
                        />
                        <hr>
                        <user-reports
                            v-if="loggedInUser.isNat"
                            :user-mongo-id="selectedEvaluation.user.id"
                        />
                        <hr>
                        <modding-activity
                            :username="selectedEvaluation.user.username"
                        />
                    </div>
                    <hr>
                </template>

                <discussion-info v-if="selectedEvaluation.discussion && (selectedEvaluation.isApplication || !isNatEval)" />

                <template v-if="selectedEvaluation.active">
                    <evaluation-input v-if="selectedEvaluation.isApplication || !isNatEval" />
                    <nat-self-evaluation v-else-if="!selectedEvaluation.discussion && selectedEvaluation.user.id == loggedInUser.id && isNatEval" />
                    <nat-evaluated-summary v-else-if="selectedEvaluation.discussion && isNatEval && selectedEvaluation.user.id == loggedInUser.id && !loggedInUser.isNatLeader" />
                    <nat-leader-evaluation v-else-if="selectedEvaluation.discussion && loggedInUser.isNatLeader && isNatEval" />
                    <div v-else>
                        There's nothing for you to do here. :)
                    </div>
                </template>
            </div>
            <debug-view-document
                v-if="loggedInUser.isAdmin"
                :document="selectedEvaluation"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { isNatEvaluation } from 'shared/isNatEvaluation';
import ModalHeader from './ModalHeader.vue';
import PreviousEvaluations from './common/PreviousEvaluations.vue';
import UserNotes from './common/UserNotes.vue';
import UserReports from './currentBns/UserReports.vue';
import ModdingActivity from './currentBns/ModdingActivity.vue';
import NatSelfEvaluation from './currentBns/NatSelfEvaluation.vue';
import NatEvaluatedSummary from './currentBns/NatEvaluatedSummary.vue';
import NatLeaderEvaluation from './currentBns/NatLeaderEvaluation.vue';
import UserActivity from './currentBns/userActivity/UserActivity.vue';
import EvaluationInput from './common/EvaluationInput.vue';
import EvaluationLink from './common/EvaluationLink.vue';
import EvaluatorAssignments from './common/EvaluatorAssignments.vue';
import AssignmentHistory from './common/AssignmentHistory.vue';
import ModalDialog from '../../ModalDialog.vue';
import MainApplicationInfo from './applications/MainApplicationInfo.vue';
import DiscussionInfo from './DiscussionInfo.vue';
import EvaluationIsSecurityChecked from './applications/EvaluationIsSecurityChecked.vue';
import DebugViewDocument from '../../DebugViewDocument.vue';
import ApplicantComment from './applications/ApplicantComment.vue';
import RiskCard from '../../penalties/RiskCard.vue';
import PenaltyHistory from '../../penalties/PenaltyHistory.vue';

export default {
    name: 'EvaluationInfo',
    components: {
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        NatSelfEvaluation,
        NatEvaluatedSummary,
        NatLeaderEvaluation,
        UserActivity,
        EvaluationInput,
        EvaluationLink,
        EvaluatorAssignments,
        ModalDialog,
        MainApplicationInfo,
        DiscussionInfo,
        EvaluationIsSecurityChecked,
        DebugViewDocument,
        AssignmentHistory,
        ApplicantComment,
        RiskCard,
        PenaltyHistory,
    },
    data () {
        return {
            vote: null,
            riskResult: null,
            riskLoading: false,
            penaltyNonce: 0,
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('evaluations', ['selectedEvaluation']),
        documentTitle() {
            if (!this.selectedEvaluation || !this.selectedEvaluation.user) return '';

            return `${this.selectedEvaluation.user.username}'s ${this.selectedEvaluation.isApplication ? 'App' : 'Eval'}`;
        },
        modes() {
            if (!this.selectedEvaluation) return [];

            if (this.selectedEvaluation.user && this.selectedEvaluation.user.modes && this.selectedEvaluation.user.modes.length && !this.selectedEvaluation.user.modes.includes('none'))
                return this.selectedEvaluation.user.modes;

            return [this.selectedEvaluation.mode];
        },
        isNatEval () {
            return isNatEvaluation(this.selectedEvaluation);
        },
        showRiskUi () {
            if (!this.selectedEvaluation || !this.loggedInUser) return false;
            if (!this.loggedInUser.isNat && !this.loggedInUser.isTrialNat) return false;
            if (this.selectedEvaluation.isApplication || this.isNatEval) return false;
            if (this.selectedEvaluation.mode === 'none') return false;

            return true;
        },
    },
    watch: {
        'selectedEvaluation.id': {
            immediate: true,
            handler() {
                const snapshot = this.selectedEvaluation && this.selectedEvaluation.riskSnapshot;

                this.riskResult = this.showRiskUi && snapshot && snapshot.level
                    ? snapshot
                    : null;
                this.riskLoading = false;
            },
        },
    },
    methods: {
        applyRiskResult(data) {
            this.riskResult = data;
            this.$store.commit('evaluations/updateEvaluation', {
                ...this.selectedEvaluation,
                riskSnapshot: data,
                riskLevel: data.level,
                riskScore: data.score,
                limitedHistory: data.limitedHistory,
            });
        },
        async refreshRisk(e) {
            if (!this.showRiskUi || !this.selectedEvaluation.active) return;

            const evalId = this.selectedEvaluation.id;

            this.riskLoading = true;

            const data = await this.$http.executePost(
                `/bnEval/refreshRisk/${evalId}`,
                {},
                e
            );

            if (!this.selectedEvaluation || this.selectedEvaluation.id !== evalId) return;

            if (this.$http.isValid(data) && data.level) {
                this.applyRiskResult(data);
            }

            this.riskLoading = false;
        },
        onPenaltyChanged() {
            this.penaltyNonce += 1;

            if (this.selectedEvaluation.active) {
                this.refreshRisk();
            }
        },
        evaluatorVibeChecked () {
            if (!this.loggedInUser.isNat) {
                return true; // no vibe check needed for non-NAT
            }

            for (const vibeCheck of this.selectedEvaluation.vibeChecks) {
                if (vibeCheck.mediator.id == this.loggedInUser.id) {
                    return true;
                }
            }

            ;

            return false;
        },
        async submitVibeCheck (e) {
            if (!this.vote) {
                this.$store.dispatch('updateToastMessages', {
                    message: `You must vote.`,
                    type: 'danger',
                });
            } else {
                const result = await this.$http.executePost(
                    `/appEval/submitVibeCheck/${this.selectedEvaluation.id}`, {
                        vote: this.vote,
                    }, e);

                if (result && !result.error) {
                    this.$store.commit('evaluations/updateEvaluation', result);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Submitted vibes`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>
