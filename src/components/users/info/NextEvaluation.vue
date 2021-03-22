<template>
    <p>
        <b>{{ displayMode ? `Next ${mode == 'osu' ? 'osu!' : 'osu!' + mode} evaluation:` : 'Next evaluation:' }}</b> {{ nextEvaluationDate }}
    </p>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'NextEvaluation',
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
        /** @returns {boolean} */
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
            const nextEvaluationDate = await this.$http.executeGet(`/users/loadNextEvaluation/${this.selectedUser.id}/${this.mode}`);

            if (nextEvaluationDate) {
                this.nextEvaluationDate = nextEvaluationDate.slice(0,10);
            }
        },
    },
};
</script>