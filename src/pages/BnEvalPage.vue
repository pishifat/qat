<template>
    <div>
        <eval-page
            kind="currentBns"
        >
            <template #individual-evaluations-title>
                <button
                    class="btn btn-primary"
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
import AddEvaluations from '../components/evaluations/AddEvaluations.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvaluations,
        EvalPage,
    },
    mixins: [ postData ],
    methods: {
        openAddEvaluations() {
            this.$store.commit('evaluations/updateCheckedEvaluations', []);
        },
    },
};
</script>