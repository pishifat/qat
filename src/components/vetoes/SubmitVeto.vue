<template>
    <div id="addVeto" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-nat">
                    <h5 class="modal-title text-dark">
                        Submit a veto for mediation
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <div class="row text-shadow">
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
                            <small class="text-shadow mb-1">Permalink to the veto post on the modding discussion page</small>
                            <input
                                v-model="discussionLink"
                                type="text"
                                class="form-control"
                                placeholder="veto discussion post link..."
                            >
                        </div>
                        <div class="row mb-2">
                            <small class="text-shadow mb-1">Summarize the reason for the veto. If your summary is inappropriate, the veto will not be mediated</small>
                            <input
                                v-model="shortReason"
                                type="text"
                                class="form-control"
                                placeholder="reason for veto..."
                            >
                        </div>
                        <p class="errors text-shadow">
                            {{ info }}
                        </p>
                        <hr>
                        <button type="submit" class="btn btn-nat float-right" @click="submitVeto($event)">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'SubmitVeto',
    mixins: [postData],
    data() {
        return {
            discussionLink: null,
            shortReason: null,
            mode: null,
            info: null,
        };
    },
    methods: {
        async submitVeto (e) {
            this.info = '';

            if (!this.discussionLink || !this.shortReason || !this.mode) {
                this.info = 'Cannot leave fields blank!';
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

                console.log(veto);

                if (veto) {
                    if (veto.error) {
                        this.info = veto.error;
                    } else {
                        $('#addVeto').modal('hide');
                        this.$emit('submit-veto', veto);
                    }
                }
            }
        },
    },
};
</script>