<template>
    <modal-dialog id="addApplication" title="Create a BN application">
        <div class="container">
            <div class="row mb-3">
                <div class="col-sm-12">
                    <b class="me-4">Game mode:</b>
                    <mode-select v-model="mode" :max-selection="1" class="ms-2" />
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-sm-6">
                    <b>User:</b>
                    <input
                        v-model="username"
                        class="form-control"
                        type="text"
                        placeholder="username or osuID..."
                    >
                </div>
            </div>
            <div class="row col-sm-6">
                <b>Comment:</b>
            </div>
            <div class="row mb-3">
                <div class="col-sm-12">
                    <markdown-editor
                        ref="editor"
                        v-model="comment"
                        class="mb-2"
                        storage-key="md:add-application"
                        :rows="2"
                        placeholder="Comment..."
                    />
                </div>
            </div>
            <hr>
            <button class="btn btn-primary mb-2 mt-4 w-100" @click="createApplication($event)">
                Create application
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../ModalDialog.vue';
import ModeSelect from '../ModeSelect.vue';
import MarkdownEditor from '../MarkdownEditor.vue';

export default {
    name: 'AddApplication',
    components: {
        ModalDialog,
        ModeSelect,
        MarkdownEditor,
    },
    data() {
        return {
            username: '',
            mode: '',
            comment: '',
        };
    },
    methods: {
        async createApplication(e) {
            if (confirm(`Are you sure? Only use this in special circumstances AND if you know what you're doing.`)) {
                if (!this.mode.length || !this.username.length) {
                    this.$store.dispatch('updateToastMessages', {
                        message: `Must select game mode and input a username!`,
                        type: 'danger',
                    });

                    return;
                }

                const data = await this.$http.executePost(
                    '/appEval/AddApplication/',
                    {
                        username: this.username,
                        mode: this.mode,
                        comment: this.comment,
                    },
                    e
                );

                if (this.$http.isValid(data)) {
                    this.$refs.editor.clearDraft();
                    this.comment = '';
                    this.$store.commit('evaluations/setEvaluations', data.applications);

                    if (data.applications.length) {
                        $('#addApplication').modal('hide');
                    } else {
                        this.$store.dispatch('updateToastMessages', {
                            message: `Error adding application!`,
                            type: 'danger',
                        });
                    }

                }
            }
        },
    },
};
</script>
