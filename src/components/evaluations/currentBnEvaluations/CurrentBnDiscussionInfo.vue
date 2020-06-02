<template>
    <current-bn-info
        id="currentBnDiscussionInfo"
        :evaluation="selectedDiscussRound"
    >
        <template #actions>
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
                :consensus="selectedDiscussRound.consensus"
            />
        </template>
    </current-bn-info>
</template>

<script>
import { mapGetters } from 'vuex';
import Consensus from '../info/Consensus.vue';
import Cooldown from '../info/Cooldown.vue';
import FeedbackInfo from '../info/FeedbackInfo.vue';
import Evaluations from '../info/Evaluations.vue';
import CurrentBnInfo from './CurrentBnInfo.vue';

export default {
    name: 'CurrentBnDiscussionInfo',
    components: {
        Consensus,
        Cooldown,
        FeedbackInfo,
        Evaluations,
        CurrentBnInfo,
    },
    computed: mapGetters([
        'selectedDiscussRound',
    ]),
    watch: {
        selectedDiscussRound() {
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.selectedDiscussRound.id}`);
        },
    },
};
</script>
