<template>
    <div>
        <p>
            <b>Visibility:</b>
            <span :class="selectedEvaluation.isPublic ? 'text-success' : 'text-danger'">
                {{ selectedEvaluation.isPublic ? 'Public' : 'Private' }}
            </span>
            <span v-if="loggedInUser.id === selectedEvaluation.user.id" class="btn-group ml-2">
                <button
                    class="btn btn-sm btn-success"
                    :disabled="selectedEvaluation.isPublic"
                    @click="toggleVisibility(true, $event);"
                >
                    Public
                </button>
                <button
                    class="btn btn-sm btn-danger"
                    :disabled="!selectedEvaluation.isPublic"
                    @click="toggleVisibility(false, $event);"
                >
                    Private
                </button>
            </span>
        </p>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'EvaluationVisibility',
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('evaluations', ['selectedEvaluation']),
    },
    methods: {
        async toggleVisibility(isPublic, e) {
            const res = await this.$http.executePost(`/appEval/toggleVisibility/${this.selectedEvaluation.id}`, {
                isPublic,
            });

            if (this.$http.isValid(res)) {
                this.$store.commit('evaluations/updateEvaluation', res);
                this.$store.dispatch('updateToastMessages', {
                    message: `Set visibility to ${isPublic ? 'public' : 'private'}`,
                    type: 'success',
                });
            }
        },
    },      
}; 
</script>
