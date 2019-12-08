<template>
    <div>
        <p class="min-spacing text-shadow">
            Previous evaluations:
        </p>
        <ul v-if="previousEvaluations">
            <li v-if="!previousEvaluations.length" class="small min-spacing text-shadow">User has no previous evaluations</li>
            <li v-else v-for="evaluation in previousEvaluations" :key="evaluation.id" class="small text-shadow">
                <a :href="'http://bn.mappersguild.com/evalarchive?eval=' + evaluation.id">{{ evaluation.updatedAt.slice(0,10) }} - {{evaluation.applicant ? "APPLICATION" : "BN EVAL"}}</a> - <span :class="'vote-' + evaluation.consensus">{{ evaluation.consensus.toUpperCase() }}</span>
                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(evaluation.feedback)"></pre>
            </li>
        </ul>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'previous-evaluations',
    props: {
        userMongoId: String,
    },
    mixins: [ filterLinks ],
    watch: {
        userMongoId() {
            this.findPreviousEvaluations();
        },
    },
    mounted () {
        this.findPreviousEvaluations();
    },
    data() {
        return {
            previousEvaluations: null,
        };
    },
    methods: {
        async findPreviousEvaluations() {
            this.previousEvaluations = null;
            axios
                .get('/bnEval/findPreviousEvaluations/' + this.userMongoId)
                .then(response => {
                    this.previousEvaluations = response.data.previousEvaluations;
                });
        }
    }
};
</script>