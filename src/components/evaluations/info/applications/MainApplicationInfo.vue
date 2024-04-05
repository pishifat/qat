<template>
    <div>
        <mods
            :mods="selectedEvaluation.mods"
            :reasons="selectedEvaluation.reasons"
            :oszs="selectedEvaluation.oszs"
            :osu-id="selectedEvaluation.user.osuId"
            :is-new-evaluation-format="selectedEvaluation.isNewEvaluationFormat"
        />

        <applicant-comment
            :comment="selectedEvaluation.comment"
        />

        <evaluation-visibility />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Mods from './Mods.vue';
import ApplicantComment from './ApplicantComment.vue';
import EvaluationVisibility from '../common/EvaluationVisibility.vue';

export default {
    name: 'MainApplicationInfo',
    components: {
        Mods,
        ApplicantComment,
        EvaluationVisibility,
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
