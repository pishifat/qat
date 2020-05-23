<template>
    <div id="currentBnDiscussionInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="selectedDiscussRound.mode"
                    :nat-evaluators="selectedDiscussRound.natEvaluators || []"
                    :osu-id="selectedDiscussRound.bn.osuId"
                    :username="selectedDiscussRound.bn.username"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <p class="text-shadow min-spacing mb-1">
                            Recent BN activity
                        </p>
                        <div class="container mb-3">
                            <user-activity
                                :osu-id="selectedDiscussRound.bn.osuId"
                                :modes="modes"
                                :deadline="selectedDiscussRound.deadline"
                                :is-nat="evaluator.isNat"
                                :mongo-id="selectedDiscussRound.bn.id"
                            />
                        </div>
                    </div>
                    <div class="container">
                        <p class="text-shadow">
                            <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
                        </p>
                        <div id="additionalInfo" class="collapse container">
                            <previous-evaluations
                                :user-mongo-id="selectedDiscussRound.bn.id"
                            />
                            <user-notes
                                :user-mongo-id="selectedDiscussRound.bn.id"
                            />
                            <user-reports
                                :user-mongo-id="selectedDiscussRound.bn.id"
                            />
                            <modding-activity
                                :username="selectedDiscussRound.bn.username"
                            />
                        </div>
                        <hr>
                        <consensus
                            :consensus="selectedDiscussRound.consensus"
                            :nominator-assessment-mongo-id="selectedDiscussRound.id"
                            :is-low-activity="selectedDiscussRound.isLowActivity"
                            :resigned-on-good-terms="selectedDiscussRound.resignedOnGoodTerms"
                            :resigned-on-standard-terms="selectedDiscussRound.resignedOnStandardTerms"
                            :group="selectedDiscussRound.bn.group"
                            :is-move-to-nat="selectedDiscussRound.isMoveToNat"
                            :is-move-to-bn="selectedDiscussRound.isMoveToBn"
                        />
                        <cooldown
                            v-if="selectedDiscussRound.consensus == 'fail'"
                            :cooldown-date="selectedDiscussRound.cooldownDate"
                            :origin-date="selectedDiscussRound.updatedAt"
                            :nominator-assessment-mongo-id="selectedDiscussRound.id"
                        />
                        <feedback-info
                            v-if="selectedDiscussRound.consensus && !(selectedDiscussRound.isMoveToNat || selectedDiscussRound.isMoveToBn)"
                            :consensus="selectedDiscussRound.consensus"
                            :osu-id="selectedDiscussRound.bn.osuId"
                            :cooldown-date="selectedDiscussRound.cooldownDate"
                            :evaluations="selectedDiscussRound.evaluations"
                            :probation="selectedDiscussRound.bn.probation"
                            :is-low-activity="selectedDiscussRound.isLowActivity"
                            :resigned-on-good-terms="selectedDiscussRound.resignedOnGoodTerms"
                            :resigned-on-standard-terms="selectedDiscussRound.resignedOnStandardTerms"
                            :mode="selectedDiscussRound.mode"
                            :saved-feedback="selectedDiscussRound.feedback"
                            :nominator-assessment-mongo-id="selectedDiscussRound.id"
                        />
                        <hr v-if="selectedDiscussRound.consensus">
                        <evaluations
                            :evaluations="selectedDiscussRound.evaluations"
                            :is-nat="true"
                            :consensus="selectedDiscussRound.consensus"
                        />
                        <evaluation-input
                            :nominator-assessment-mongo-id="selectedDiscussRound.id"
                            :evaluations="selectedDiscussRound.evaluations"
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
import EvaluationInput from '../info/EvaluationInput.vue';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'CurrentBnDiscussionInfo',
    components: {
        UserActivity,
        ModalHeader,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModdingActivity,
        EvaluationInput,
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedDiscussRound',
        ]),
        submittedEvaluators() {
            let evaluators = new Array;
            this.selectedDiscussRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });

            return evaluators;
        },
        modes() {
            let modes = [];
            if (this.selectedDiscussRound.bn.modes.length) modes = this.selectedDiscussRound.bn.modes;
            else modes.push(this.selectedDiscussRound.mode);

            return modes;
        },
    },
    watch: {
        selectedDiscussRound() {
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.selectedDiscussRound.id}`);
        },
    },
};
</script>

<style>

</style>