<template>
    <div>
        <mods
            :mods="selectedEvaluation.mods"
            :reasons="selectedEvaluation.reasons"
            :osu-id="selectedEvaluation.user.osuId"
        />

        <applicant-comment
            :comment="selectedEvaluation.test.comment"
        />

        <template v-if="(loggedInUser.isNat || loggedInUser.isTrialNat) && selectedEvaluation.test.totalScore > 0">
            <test-results
                :test-score="selectedEvaluation.test.totalScore"
                :osu-id="selectedEvaluation.user.osuId"
            />
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Mods from './Mods.vue';
import TestResults from './TestResults.vue';
import ApplicantComment from './ApplicantComment.vue';

export default {
    name: 'MainApplicationInfo',
    components: {
        Mods,
        TestResults,
        ApplicantComment,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
};
</script>
