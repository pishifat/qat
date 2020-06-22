<template>
    <modal-dialog id="addDiscussion" title="Submit a topic for vote">
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
            <div class="row">
                <p>NAT only vote:</p>
                <div class="row ml-4">
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="BN + NAT vote"
                    >
                        <input
                            v-model="group"
                            type="radio"
                            class="cross-radio hide-default"
                            name="bn"
                            value="bn"
                        >
                        <i class="fas fa-times fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="NAT only vote"
                    >
                        <input
                            v-model="group"
                            type="radio"
                            class="checkmark-radio hide-default"
                            name="nat"
                            value="nat"
                        >
                        <i class="fas fa-check fa-lg" />
                    </label>
                </div>
            </div>
            <div class="row">
                <p>Neutral vote allowed:</p>
                <div class="row ml-4">
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="neutral not allowed"
                    >
                        <input
                            v-model="neutral"
                            type="radio"
                            class="cross-radio hide-default"
                            name="neutral"
                            value="noNeutral"
                        >
                        <i class="fas fa-times fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="neutral allowed"
                    >
                        <input
                            v-model="neutral"
                            type="radio"
                            class="checkmark-radio hide-default"
                            name="neutral"
                            value="neutral"
                        >
                        <i class="fas fa-check fa-lg" />
                    </label>
                </div>
            </div>
            <div class="row mb-3">
                <small class="mb-1">Link to relevant discussion (optional)</small>
                <input
                    v-model="discussionLink"
                    type="text"
                    class="form-control"
                    placeholder="thread link..."
                >
            </div>
            <div class="row mb-3">
                <small class="mb-1">Title for discussion vote</small>
                <input
                    v-model="title"
                    type="text"
                    class="form-control"
                    placeholder="title..."
                >
            </div>
            <div class="row mb-2">
                <small class="mb-1">Summarize the discussion's proposed change(s)</small>
                <input
                    v-model="shortReason"
                    type="text"
                    class="form-control"
                    placeholder="change..."
                >
            </div>
            <hr>
            <button type="submit" class="btn btn-primary float-right" @click="submitDiscussion($event)">
                Submit
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../ModalDialog.vue';
import postData from '../../mixins/postData.js';

export default {
    name: 'SubmitDiscussion',
    components: {
        ModalDialog,
    },
    mixins: [postData],
    data() {
        return {
            discussionLink: null,
            title: null,
            shortReason: null,
            mode: null,
            group: 'bn',
            neutral: 'neutral',
        };
    },
    methods: {
        async submitDiscussion(e) {
            if (!this.shortReason || !this.title || !this.mode) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Required fields missing!`,
                    type: 'danger',
                });
            } else {
                if (!this.discussionLink) this.discussionLink = '';
                const discussionVote = await this.executePost(
                    '/discussionVote/submit',
                    {
                        discussionLink: this.discussionLink,
                        title: this.title,
                        shortReason: this.shortReason,
                        mode: this.mode,
                        isNatOnly: this.group == 'nat',
                        neutralAllowed: this.neutral == 'neutral',
                    },
                    e
                );

                if (discussionVote && !discussionVote.error) {
                    $('#addDiscussion').modal('hide');
                    this.$store.commit('discussionVote/addDiscussionVote', discussionVote);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Submitted discussion`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>

<style>
</style>
