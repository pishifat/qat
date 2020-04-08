<template>
    <div id="currentBnDiscussionInfo" class="modal fade" tabindex="-1">
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
                        </div>
                        <hr>
                        <consensus
                            :consensus="evalRound.consensus"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :is-application="false"
                            :is-low-activity="evalRound.isLowActivity"
                            :resigned-on-good-terms="evalRound.resignedOnGoodTerms"
                            :group="evalRound.bn.group"
                            :is-move-to-nat="evalRound.isMoveToNat"
                            :is-move-to-bn="evalRound.isMoveToBn"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <cooldown
                            v-if="evalRound.consensus == 'fail'"
                            :cooldown-date="evalRound.cooldownDate"
                            :origin-date="evalRound.updatedAt"
                            :nominator-assessment-mongo-id="evalRound.id"
                            :is-application="false"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <feedback-info
                            v-if="evalRound.consensus && !(evalRound.isMoveToNat || evalRound.isMoveToBn)"
                            :consensus="evalRound.consensus"
                            :osu-id="evalRound.bn.osuId"
                            :cooldown-date="evalRound.cooldownDate"
                            :evaluations="evalRound.evaluations"
                            :probation="evalRound.bn.probation"
                            :is-low-activity="evalRound.isLowActivity"
                            :resigned-on-good-terms="evalRound.resignedOnGoodTerms"
                            :mode="evalRound.mode"
                            :saved-feedback="evalRound.feedback"
                            :nominator-assessment-mongo-id="evalRound.id"
                            @update-nominator-assessment="$emit('update-eval-round', $event);"
                        />
                        <hr v-if="evalRound.consensus">
                        <evaluations
                            :evaluations="evalRound.evaluations"
                            :is-nat="true"
                            :consensus="evalRound.consensus"
                        />
                        <evaluation-input
                            :is-application="false"
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
};
</script>

<style>

</style>