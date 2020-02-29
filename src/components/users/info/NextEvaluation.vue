<template>
    <p class="text-shadow">
        Next evaluation: {{ nextEvaluationDate.slice(0,10) }}
    </p>
</template>

<script>

export default {
    name: 'duration',
    props: {
        userId: String,
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
            await axios
                .get('/users/loadNextEvaluation/' + this.userId)
                .then(response => {
                    this.nextEvaluationDate = response.data;
                });
        },
    },
};
</script>