<template>
    <div>
        <eval-page
            kind="currentBns"
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
                    data-target="#addEvaluations"
                    @click="openAddEvaluations()"
                >
                    Add users to evaluate
                </button>
            </template>
            <template #instructions>
                <trial-instructions v-if="loggedInUser.isNatOrTrialNat" />
            </template>
        </eval-page>

        <add-evaluations />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import AddEvaluations from '../components/evaluations/AddEvaluations.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';
import TrialInstructions from '../components/evaluations/TrialInstructions.vue';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvaluations,
        EvalPage,
        TrialInstructions,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        openAddEvaluations() {
            this.$store.commit('evaluations/updateCheckedEvaluations', []);
        },
    },
};
</script>