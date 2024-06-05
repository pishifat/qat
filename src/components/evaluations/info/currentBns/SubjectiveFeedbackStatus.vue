<template>
    <p>
        <b>Subjective feedback: </b>
        <span 
            v-if="selectedEvaluation.user.subjectiveEvalFeedback"
            class="text-success"
        >
            Allowed
        </span>
        <span v-else class="text-danger">
            Not allowed
        </span>
    </p>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'SubjectiveFeedbackStatus',
    computed: {
        ...mapGetters('evaluations', ['selectedEvaluation']),
    },
}
</script>
