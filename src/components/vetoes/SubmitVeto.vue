<template>
    <modal-dialog id="addVeto" title="Submit a veto for mediation">
        <div class="container">
            <div class="row">
                <p>Game mode:</p>
                <div class="row ml-4">
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="osu!"
                    >
                        <input
                            v-model="mode"
                            type="radio"
                            class="osu-radio hide-default"
                            name="osu"
                            value="osu"
                            checked
                        >
                        <i class="fas fa-circle fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="osu!taiko"
                    >
                        <input
                            v-model="mode"
                            type="radio"
                            class="taiko-radio hide-default"
                            name="taiko"
                            value="taiko"
                        >
                        <i class="fas fa-drum fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="osu!catch"
                    >
                        <input
                            v-model="mode"
                            type="radio"
                            class="catch-radio hide-default"
                            name="catch"
                            value="catch"
                        >
                        <i class="fas fa-apple-alt fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="osu!mania"
                    >
                        <input
                            v-model="mode"
                            type="radio"
                            class="mania-radio hide-default"
                            name="mania"
                            value="mania"
                        >
                        <i class="fas fa-stream fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="all game modes"
                    >
                        <input
                            v-model="mode"
                            type="radio"
                            class="all-radio hide-default"
                            name="all"
                            value="all"
                        >
                        <i class="fas fa-globe fa-lg" />
                    </label>
                </div>
            </div>

            <div class="row mb-3">
                <small class="mb-1">Permalink to the veto post on the modding discussion page</small>
                <input
                    v-model="discussionLink"
                    type="text"
                    class="form-control"
                    placeholder="veto discussion post link..."
                >
            </div>

            <div class="row mb-2">
                <small class="mb-1">Summarize the reason for the veto. If your summary is inappropriate, the veto will not be mediated</small>
                <input
                    v-model="shortReason"
                    type="text"
                    class="form-control"
                    placeholder="reason for veto..."
                >
            </div>

            <hr>

            <button type="submit" class="btn btn-primary float-right" @click="submitVeto($event)">
                Submit
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import postData from '../../mixins/postData.js';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'SubmitVeto',
    components: {
        ModalDialog,
    },
    mixins: [postData],
    data() {
        return {
            discussionLink: null,
            shortReason: null,
            mode: null,
        };
    },
    methods: {
        async submitVeto (e) {
            if (!this.discussionLink || !this.shortReason || !this.mode) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const veto = await this.executePost(
                    '/vetoes/submit',
                    {
                        discussionLink: this.discussionLink,
                        shortReason: this.shortReason,
                        mode: this.mode,
                    },
                    e
                );

                if (veto && !veto.error) {
                    $('#addVeto').modal('hide');
                    this.$store.commit('vetoes/addVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Submitted veto`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>