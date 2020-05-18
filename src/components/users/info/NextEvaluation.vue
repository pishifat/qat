<template>
    <p class="text-shadow">
        Next evaluation: {{ nextEvaluationDate.slice(0,10) }}
    </p>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'Duration',
    mixins: [ postData ],
    props: {
        userId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            nextEvaluationDate: '...',
        };
    },
    watch: {
        userId() {
            this.nextEvaluationDate = '...';
            this.loadNextEvaluation();
        },
    },
    mounted() {
        this.loadNextEvaluation();
    },
    methods: {
        async loadNextEvaluation() {
            const nextEvaluationDate = await this.executeGet('/users/loadNextEvaluation/' + this.userId);

            if (nextEvaluationDate) {
                this.nextEvaluationDate = nextEvaluationDate;
            }
        },
    },
};
</script>