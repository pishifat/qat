<template>
    <div>
        <p>
            <b>Previous evaluations:</b>
        </p>

        <ul class="text-secondary">
            <li v-if="!previousEvaluations" class="small">
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
                <a :href="'http://bn.mappersguild.com/evalarchive?eval=' + evaluation.id" class="small">
                    {{ evaluation.applicant ? evaluation.createdAt.slice(0,10) : evaluation.deadline.slice(0,10) }}
                    -
                    <i v-if="evaluation.mode.includes('osu')" class="far fa-circle" />
                    <i v-if="evaluation.mode.includes('taiko')" class="fas fa-drum" />
                    <i v-if="evaluation.mode.includes('catch')" class="fas fa-apple-alt" />
                    <i v-if="evaluation.mode.includes('mania')" class="fas fa-stream" />
                    {{ evaluation.applicant ? "APPLICATION" : "BN EVAL" }}
                </a>
                -
                <span :class="'text-' + evaluation.consensus">
                    {{ evaluation.consensus.toUpperCase() }}
                </span>

                <div v-html="$md.render(evaluation.feedback)" />
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'PreviousEvaluations',
    mixins: [ postData ],
    props: {
        userMongoId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            previousEvaluations: null,
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
            this.previousEvaluations = null;
            const res = await this.executeGet('/bnEval/findPreviousEvaluations/' + this.userMongoId);

            if (res) {
                this.previousEvaluations = res.previousEvaluations;
            }
        },
    },
};
</script>