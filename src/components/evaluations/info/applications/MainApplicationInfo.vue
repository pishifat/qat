<template>
    <div>
        <mods
            :mods="selectedEvaluation.mods"
            :reasons="selectedEvaluation.reasons"
            :oszs="selectedEvaluation.oszs"
            :osu-id="selectedEvaluation.user.osuId"
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
import EvaluationVisibility from './EvaluationVisibility.vue';

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
