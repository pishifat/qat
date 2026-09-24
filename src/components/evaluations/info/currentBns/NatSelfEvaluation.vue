<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <div>
                    <b>Summary of your NAT activity:</b>
                </div>

                <small>Summarize your contributions to osu! and the NAT since your last evaluation (or the last 2 months). This will appear as a "note" on your user card.</small>
                <markdown-editor
                    ref="editor"
                    v-model="selfSummaryText"
                    :storage-key="'md:self-summary:' + selectedEvaluation.user.id"
                    :rows="4"
                    maxlength="5000"
                />
            </div>
        </div>

        <div class="d-flex flex-wrap align-items-center justify-content-end">
            <button class="btn btn-sm btn-primary float-end" @click="saveNote($event)">
                {{ noteId ? 'Update Summary' : 'Submit Summary' }}
            </button>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import MarkdownEditor from '../../../MarkdownEditor.vue';

export default {
    name: 'NatSelfEvaluation',
    components: {
        MarkdownEditor,
    },
    data() {
        return {
            selfSummaryText: '',
            noteId: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('evaluations', [
            'evaluations',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    watch: {
        selectedEvaluation() {
            this.findUserSummary();
        },
    },
    mounted() {
        this.findUserSummary();
    },
    methods: {
        findUserSummary() {
            this.selfSummaryText = '';
            this.noteId = '';

            if (this.selectedEvaluation.selfSummary) {
                this.selfSummaryText = this.selectedEvaluation.selfSummary.comment;
                this.noteId = this.selectedEvaluation.selfSummary.id;
            }
        },
        async saveNote(e) {
            if (!this.selfSummaryText.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Summary cannot be empty.',
                    type: 'danger',
                });

                return;
            }

            const result = await this.$http.executePost('/users/nat/saveNote/' + this.selectedEvaluation.user.id, { noteId: this.noteId, evaluationId: this.selectedEvaluation.id, comment: this.selfSummaryText, isSummary: true }, e);

            if (result && !result.error) {
                this.$refs.editor.clearDraft();

                if (result.evaluation) {
                    this.$store.commit('evaluations/updateEvaluation', result.evaluation);
                }

                $('#evaluationInfo').modal('hide');

                const data = await this.$http.initialRequest(`/bnEval/relevantInfo`);

                if (this.$http.isValid(data)) {
                    this.$store.commit(`evaluations/setEvaluations`, data.evaluations);
                    const id = this.$route.query.id;

                    if (id) {
                        const i = this.evaluations.findIndex(a => a.id == id);

                        if (i >= 0) {
                            this.$store.commit(`evaluations/setSelectedEvaluationId`, id);
                            $('#evaluationInfo').modal('show');
                        }
                    }
                }

                this.$store.dispatch('updateToastMessages', {
                    message: 'Submitted summary',
                    type: 'success',
                });
            }
        },
    },
};
</script>
