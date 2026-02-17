<template>
    <modal-dialog id="addApplication" title="Create a BN application">
        <div class="container">
            <div class="row mb-3">
                <div class="col-sm-12">
                    <b class="mr-4">Game mode:</b>
                    <mode-select v-model="mode" :max-selection="1" class="ml-2" />
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
                <div class="col-sm-6">
                    <textarea
                        v-model="comment"
                        class="form-control mb-2"
                        rows="2"
                        placeholder="Comment..."
                    />
                </div>
                <div class="col-sm-6 mb-2">
                    <div v-if="comment && comment.length" class="small card card-body v-html-content" v-html="$md.render(comment)" />
                    <div v-else class="small card card-body text-secondary">
                        comment preview
                    </div>
                </div>
            </div>
            <hr>
            <button class="btn btn-primary mb-2 mt-4 btn-block" @click="createApplication($event)">
                Create application
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../ModalDialog.vue';
import ModeSelect from '../ModeSelect.vue';

export default {
    name: 'AddApplication',
    components: {
        ModalDialog,
        ModeSelect,
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
