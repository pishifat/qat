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
                <router-link :to="'/evalarchive?id=' + evaluation.id" class="small">
                    {{ evaluation.kind === 'application' ? evaluation.updatedAt.slice(0,10) : evaluation.deadline.slice(0,10) }}
                    -
                    <mode-display
                        :modes="evaluation.mode"
                    />

                    {{ evaluation.kind === 'application' ? "APPLICATION" : "BN EVAL" }}
                </router-link>
                -
                <span :class="'text-' + evaluation.consensus">
                    {{ evaluation.consensus.toUpperCase() }}
                </span>

                <div v-if="evaluation.feedback" v-html="$md.render(evaluation.feedback)" />
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import ModeDisplay from '../../../ModeDisplay.vue';

export default {
    name: 'PreviousEvaluations',
    components: {
        ModeDisplay,
    },
    mixins: [ postData ],
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
            const data = await this.executeGet('/bnEval/findPreviousEvaluations/' + this.userMongoId);

            if (data) {
                this.previousEvaluations = data.previousEvaluations;
                this.isLoading = false;
            }
        },
    },
};
</script>