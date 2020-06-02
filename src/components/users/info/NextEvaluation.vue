<template>
    <p>
        <b>Next evaluation:</b> {{ nextEvaluationDate }}
    </p>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'NextEvaluation',
    mixins: [ postData ],
    data() {
        return {
            nextEvaluationDate: '...',
        };
    },
    computed: {
        ...mapGetters([
            'selectedUser',
        ]),
    },
    watch: {
        selectedUser() {
            this.nextEvaluationDate = '...';
            this.loadNextEvaluation();
        },
    },
    mounted() {
        this.loadNextEvaluation();
    },
    methods: {
        async loadNextEvaluation() {
            const nextEvaluationDate = await this.executeGet('/users/loadNextEvaluation/' + this.selectedUser.id);

            if (nextEvaluationDate) {
                this.nextEvaluationDate = nextEvaluationDate.slice(0,10);
            }
        },
    },
};
</script>