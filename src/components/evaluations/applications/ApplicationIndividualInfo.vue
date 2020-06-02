<template>
    <application-info
        id="applicationIndividualInfo"
        :application="selectedIndividualApplication"
    >
        <template #additional-info>
            <evaluator-assignments
                :bn-evaluators="selectedIndividualApplication.bnEvaluators"
                :nat-evaluators="selectedIndividualApplication.natEvaluators"
                :evaluations="selectedIndividualApplication.evaluations"
                :mode="selectedIndividualApplication.mode"
                :osu-id="selectedIndividualApplication.applicant.osuId"
                :username="selectedIndividualApplication.applicant.username"
                :nominator-assessment-mongo-id="selectedIndividualApplication.id"
                :is-application="true"
            />
        </template>

        <template #actions>
            <evaluation-input
                :is-application="true"
                :nominator-assessment-mongo-id="selectedIndividualApplication.id"
                :evaluations="selectedIndividualApplication.evaluations"
            />
        </template>
    </application-info>
</template>

<script>
import { mapGetters } from 'vuex';
import EvaluatorAssignments from '../info/EvaluatorAssignments.vue';
import EvaluationInput from '../info/EvaluationInput.vue';
import ApplicationInfo from './ApplicationInfo.vue';

export default {
    name: 'ApplicationIndividualInfo',
    components: {
        EvaluatorAssignments,
        EvaluationInput,
        ApplicationInfo,
    },
    computed: {
        ...mapGetters([
            'selectedIndividualApplication',
        ]),
    },
    watch: {
        selectedIndividualApplication() {
            history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.selectedIndividualApplication.id}`);
        },
    },
};
</script>
