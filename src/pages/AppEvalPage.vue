<template>
    <div>
        <eval-page
            kind="applications"
            :discussion-evaluations-title="
                loggedInUser.isNatOrTrialNat ?
                    'Group Evaluations' :
                    'Completed Evaluations'
            "
            :discussion-evaluations-help="
                loggedInUser.isNat ?
                    'After individual evals are completed, their responses are made visible to allow discussion and form a consensus' :
                    'Results of archived evaluations you were assigned to'
            "
        >
            <template #individual-evaluations-title>
                <button
                    v-if="loggedInUser.isNat"
                    class="btn btn-primary ml-2"
                    data-toggle="modal"
                    data-target="#addApplication"
                    @click="openAddApplication()"
                >
                    Create a BN application
                </button>
            </template>
            <template #instructions>
                <evaluation-instructions />
                <trial-instructions v-if="loggedInUser.isNatOrTrialNat" />
            </template>
        </eval-page>

        <add-application />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import EvalPage from '../components/evaluations/EvalPage.vue';
import EvaluationInstructions from '../components/evaluations/EvaluationInstructions.vue';
import TrialInstructions from '../components/evaluations/TrialInstructions.vue';
import AddApplication from '../components/evaluations/AddApplication.vue';

export default {
    name: 'AppEvalPage',
    components: {
        EvalPage,
        EvaluationInstructions,
        TrialInstructions,
        AddApplication,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        openAddApplication() {
            this.$store.commit('evaluations/updateCheckedEvaluations', []);
        },
    },
};
</script>
