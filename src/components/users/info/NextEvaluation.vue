<template>
    <p>
        <b>{{ displayMode ? `Next ${mode == 'osu' ? 'osu!' : 'osu!' + mode} evaluation:` : 'Next evaluation:' }}</b> {{ nextEvaluationDate }}
    </p>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'NextEvaluation',
    mixins: [ postData ],
    props: {
        mode: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            nextEvaluationDate: '...',
        };
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
        displayMode() {
            return this.selectedUser.modes.length > 1;
        },
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
            const nextEvaluationDate = await this.executeGet(`/users/loadNextEvaluation/${this.selectedUser.id}/${this.mode}`);

            if (nextEvaluationDate) {
                this.nextEvaluationDate = nextEvaluationDate.slice(0,10);
            }
        },
    },
};
</script>