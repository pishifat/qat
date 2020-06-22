<template>
    <div>
        <eval-page
            kind="currentBns"
        >
            <template #individual-evaluations-title>
                <button
                    class="btn btn-primary"
                    data-toggle="modal"
                    data-target="#addEvalRounds"
                    @click="openAddEvalRounds()"
                >
                    Add users to evaluate
                </button>
            </template>
        </eval-page>

        <add-eval-rounds />
    </div>
</template>

<script>
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvalRounds,
        EvalPage,
    },
    mixins: [ postData ],
    methods: {
        openAddEvalRounds() {
            this.$store.commit('evaluations/updateCheckedEvaluations', []);
        },
    },
};
</script>