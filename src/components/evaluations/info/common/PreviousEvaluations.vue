<template>
    <div>
        <p>
            <b>Previous evaluations:</b>
        </p>

        <ul class="text-secondary">
            <li v-if="isLoading" class="small">
                ...
            </li>
            <li v-else-if="!previousEvaluations.length" class="small">
                User has no previous evaluations
            </li>
            <li
                v-for="evaluation in previousEvaluations"
                v-else
                :key="evaluation.id"
                class="small"
            >
                <previous-evaluation-entry
                    :evaluation="evaluation"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import PreviousEvaluationEntry from './PreviousEvaluationEntry.vue';

export default {
    name: 'PreviousEvaluations',
    components: {
        PreviousEvaluationEntry,
    },
    props: {
        userMongoId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            previousEvaluations: [],
            isLoading: true,
        };
    },
    watch: {
        userMongoId() {
            this.findPreviousEvaluations();
        },
    },
    mounted () {
        this.findPreviousEvaluations();
    },
    methods: {
        async findPreviousEvaluations() {
            this.previousEvaluations = [];
            this.isLoading = true;
            const data = await this.$http.executeGet('/bnEval/findPreviousEvaluations/' + this.userMongoId);

            if (this.$http.isValid(data)) {
                this.previousEvaluations = data.previousEvaluations;
                this.isLoading = false;
            }
        },
    },
};
</script>