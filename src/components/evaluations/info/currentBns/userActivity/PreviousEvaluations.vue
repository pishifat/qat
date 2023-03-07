<template>
    <div>
        <div class="ml-2">
            <a :href="previousEvaluations && `#${eventId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : previousEvaluations ? previousEvaluations.length : '0' }})
        </div>

        <div v-if="previousEvaluations" :id="eventId" class="collapse">
            <ul class="text-secondary">
                <p v-if="isLoading" class="small">
                    ...
                </p>
                <p v-else-if="!previousEvaluations.length" class="small">
                    None...
                </p>
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
    </div>
</template>

<script>
import PreviousEvaluationEntry from '../../common/PreviousEvaluationEntry.vue';

export default {
    name: 'PreviousEvaluations',
    components: {
        PreviousEvaluationEntry,
    },
    props: {
        header: {
            type: String,
            required: true,
        },
        eventId: {
            type: String,
            required: true,
        },
        mongoId: {
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
        mongoId() {
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
            const data = await this.$http.executeGet('/bnEval/findPreviousEvaluations/' + this.mongoId);

            if (this.$http.isValid(data)) {
                this.previousEvaluations = data.previousEvaluations;
                this.isLoading = false;
            }
        },
    },
};
</script>
