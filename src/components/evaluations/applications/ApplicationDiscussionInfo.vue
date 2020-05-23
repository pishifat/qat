<template>
    <div id="applicationDiscussionInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussApplication" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="selectedDiscussApplication.mode"
                    :nat-evaluators="selectedDiscussApplication.natEvaluators"
                    :is-application="true"
                    :osu-id="selectedDiscussApplication.applicant.osuId"
                    :username="selectedDiscussApplication.applicant.username"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="selectedDiscussApplication.mods"
                            :reasons="selectedDiscussApplication.reasons"
                            :osu-id="selectedDiscussApplication.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="selectedDiscussApplication.test.totalScore"
                            :osu-id="selectedDiscussApplication.applicant.osuId"
                        />
                        <div v-if="evaluator.isNat">
                            <p class="text-shadow">
                                <a href="#additionalInfo" data-toggle="collapse">Additional info <i class="fas fa-angle-down" /></a>
                            </p>
                            <div id="additionalInfo" class="collapse container">
                                <applicant-comment
                                    v-if="selectedDiscussApplication.test.comment"
                                    :comment="selectedDiscussApplication.test.comment"
                                />
                                <previous-evaluations
                                    :user-mongo-id="selectedDiscussApplication.applicant.id"
                                />
                                <user-notes
                                    :user-mongo-id="selectedDiscussApplication.applicant.id"
                                />
                            </div>
                        </div>
                        <hr>
                        <consensus
                            v-if="evaluator.isNat"
                            :consensus="selectedDiscussApplication.consensus"
                            :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                            :is-application="true"
                        />
                        <cooldown
                            v-if="selectedDiscussApplication.consensus == 'fail' && evaluator.isNat"
                            :cooldown-date="selectedDiscussApplication.cooldownDate"
                            :origin-date="selectedDiscussApplication.createdAt"
                            :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                            :is-application="true"
                        />
                        <feedback-info
                            v-if="selectedDiscussApplication.consensus && evaluator.isNat"
                            :consensus="selectedDiscussApplication.consensus"
                            :is-application="true"
                            :osu-id="selectedDiscussApplication.applicant.osuId"
                            :cooldown-date="selectedDiscussApplication.cooldownDate"
                            :evaluations="selectedDiscussApplication.evaluations"
                            :mode="selectedDiscussApplication.mode"
                            :saved-feedback="selectedDiscussApplication.feedback"
                            :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                        />
                        <hr v-if="selectedDiscussApplication.consensus && evaluator.isNat">
                        <evaluations
                            v-if="evaluator.isNat || selectedDiscussApplication.consensus"
                            :is-nat="evaluator.isNat"
                            :consensus="selectedDiscussApplication.consensus"
                            :evaluations="selectedDiscussApplication.evaluations"
                        />
                        <p v-else class="text-shadow small">
                            No consensus has been set, so evaluations are not visible. Check back later!
                        </p>
                        <evaluation-input
                            v-if="evaluator.isNat"
                            :is-application="true"
                            :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                            :evaluations="selectedDiscussApplication.evaluations"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import ApplicantComment from './applicationInfo/ApplicantComment.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';
import EvaluationInput from '../info/EvaluationInput.vue';

export default {
    name: 'ApplicationDiscussionInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        ApplicantComment,
        PreviousEvaluations,
        UserNotes,
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
        EvaluationInput,
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedDiscussApplication',
        ]),
    },
    watch: {
        selectedDiscussApplication() {
            history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.selectedDiscussApplication.id}`);
        },
    },
};
</script>

<style>

.eval-bg-priority {
    background-color: rgb(38, 48, 63)!important;
    box-shadow: 5px 5px 5px 5px rgb(38, 48, 63);
}

</style>