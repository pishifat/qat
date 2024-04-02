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
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Mods from './Mods.vue';
import ApplicantComment from './ApplicantComment.vue';
import EvaluationLink from '../common/EvaluationLink.vue';

export default {
    name: 'MainApplicationInfo',
    components: {
        Mods,
        ApplicantComment,
        EvaluationLink,
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
