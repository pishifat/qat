<template>
    <application-info
        id="applicationDiscussionInfo"
        :application="selectedDiscussApplication"
    >
        <template #actions>
            <template v-if="evaluator.isNat">
                <consensus
                    :consensus="selectedDiscussApplication.consensus"
                    :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                    :is-application="true"
                />
                <cooldown
                    v-if="selectedDiscussApplication.consensus == 'fail'"
                    :cooldown-date="selectedDiscussApplication.cooldownDate"
                    :origin-date="selectedDiscussApplication.createdAt"
                    :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                    :is-application="true"
                />
                <feedback-info
                    v-if="selectedDiscussApplication.consensus"
                    :consensus="selectedDiscussApplication.consensus"
                    :is-application="true"
                    :osu-id="selectedDiscussApplication.applicant.osuId"
                    :cooldown-date="selectedDiscussApplication.cooldownDate"
                    :evaluations="selectedDiscussApplication.evaluations"
                    :mode="selectedDiscussApplication.mode"
                    :saved-feedback="selectedDiscussApplication.feedback"
                    :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                />
            </template>

            <hr v-if="selectedDiscussApplication.consensus">

            <evaluations
                v-if="evaluator.isNat || selectedDiscussApplication.consensus"
                :consensus="selectedDiscussApplication.consensus"
                :evaluations="selectedDiscussApplication.evaluations"
            />
            <p v-else class="small">
                No consensus has been set, so evaluations are not visible. Check back later!
            </p>

            <evaluation-input
                v-if="evaluator.isNat"
                :is-application="true"
                :nominator-assessment-mongo-id="selectedDiscussApplication.id"
                :evaluations="selectedDiscussApplication.evaluations"
            />
        </template>
    </application-info>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';
import EvaluationInput from '../info/EvaluationInput.vue';
import ApplicationInfo from './ApplicationInfo.vue';

export default {
    name: 'ApplicationDiscussionInfo',
    components: {
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
        EvaluationInput,
        ApplicationInfo,
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
