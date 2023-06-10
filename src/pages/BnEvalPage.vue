<template>
    <div>
        <eval-page
            kind="currentBns"
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
        </eval-page>

        <add-evaluations />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import AddEvaluations from '../components/evaluations/AddEvaluations.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvaluations,
        EvalPage,
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