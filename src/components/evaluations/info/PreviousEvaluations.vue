<template>
    <div>
        <p class="min-spacing text-shadow">
            Previous evaluations:
        </p>
        <ul>
            <li v-if="!previousEvaluations" class="small min-spacing text-shadow">
                ...
            </li>
            <li v-else-if="!previousEvaluations.length" class="small min-spacing text-shadow">
                User has no previous evaluations
            </li>
            <li
                v-for="evaluation in previousEvaluations"
                v-else
                :key="evaluation.id"
                class="small text-shadow"
            >
                <a :href="'http://bn.mappersguild.com/evalarchive?eval=' + evaluation.id">
                    {{ evaluation.applicant ? evaluation.createdAt.slice(0,10) : evaluation.deadline.slice(0,10) }}
                    -
                    <i v-if="evaluation.mode.includes('osu')" class="far fa-circle" />
                    <i v-if="evaluation.mode.includes('taiko')" class="fas fa-drum" />
                    <i v-if="evaluation.mode.includes('catch')" class="fas fa-apple-alt" />
                    <i v-if="evaluation.mode.includes('mania')" class="fas fa-stream" />
                    {{ evaluation.applicant ? "APPLICATION" : "BN EVAL" }}
                </a>
                -
                <span :class="'vote-' + evaluation.consensus">
                    {{ evaluation.consensus.toUpperCase() }}
                </span>
                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(evaluation.feedback)" />
            </li>
        </ul>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'PreviousEvaluations',
    mixins: [ filterLinks ],
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
            const res = await axios.get('/bnEval/findPreviousEvaluations/' + this.userMongoId);

            if (res.data) {
                this.previousEvaluations = res.data.previousEvaluations;
            }
        },
    },
};
</script>