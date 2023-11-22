<template>
    <modal-dialog id="addDiscussion" :title="isContentReview ? 'Submit content for review' : 'Submit a topic for vote'">
        <div class="container">
            <div v-if="loggedInUser.isNat">
                <!-- inappropriate content review toggle -->
                <div class="row">
                    <p>Inappropriate content review:</p>
                    <div class="row ml-1">
                        <label
                            class="mx-1"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="vote is NOT content review"
                        >
                            <input
                                v-model="contentReview"
                                type="radio"
                                class="cross-radio hide-default"
                                name="contentReview"
                                value="noContentReview"
                            >
                            <i class="fas fa-times fa-lg" />
                        </label>
                        <label
                            class="mx-1"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="vote is content review"
                        >
                            <input
                                v-model="contentReview"
                                type="radio"
                                class="checkmark-radio hide-default"
                                name="contentReview"
                                value="contentReview"
                            >
                            <i class="fas fa-check fa-lg" />
                        </label>
                    </div>
                </div>
                <hr>
                <div v-if="!isContentReview">
                    <!-- game mode selection -->
                    <div class="row">
                        <p>Game mode:</p>
                        <mode-select
                            v-model="mode"
                            :max-selection="1"
                            :all-modes="true"
                            class="ml-2 mb-2"
                        />
                    </div>
                    <!-- NAT only toggle -->
                    <div class="row">
                        <p>NAT only vote:</p>
                        <div class="row ml-1">
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
                    <!-- neutral vote toggle -->
                    <div class="row">
                        <p>Neutral vote allowed:</p>
                        <div class="row ml-1">
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
                    <!-- reason input toggle -->
                    <div class="row">
                        <p>Reason input allowed:</p>
                        <div class="row ml-1">
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="reason input not allowed"
                            >
                                <input
                                    v-model="reason"
                                    type="radio"
                                    class="cross-radio hide-default"
                                    name="reason"
                                    value="noReason"
                                >
                                <i class="fas fa-times fa-lg" />
                            </label>
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="reason input allowed"
                            >
                                <input
                                    v-model="reason"
                                    type="radio"
                                    class="checkmark-radio hide-default"
                                    name="reason"
                                    value="reason"
                                >
                                <i class="fas fa-check fa-lg" />
                            </label>
                        </div>
                    </div>

                    <!-- custom response text input toggle -->
                    <div class="row">
                        <p>Customize vote responses:</p>
                        <div class="row ml-1">
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="use defaults (Yes/Agree, Neutral, No/Disagree)"
                            >
                                <input
                                    v-model="customText"
                                    type="radio"
                                    class="cross-radio hide-default"
                                    name="customText"
                                    value="noCustomText"
                                >
                                <i class="fas fa-times fa-lg" />
                            </label>
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="use custom vote text"
                            >
                                <input
                                    v-model="customText"
                                    type="radio"
                                    class="checkmark-radio hide-default"
                                    name="customText"
                                    value="customText"
                                >
                                <i class="fas fa-check fa-lg" />
                            </label>
                        </div>
                    </div>

                    <!-- custom vote text -->
                    <template v-if="customText == 'customText'">
                        <div class="row">
                            <small>Default vote options will replace any empty inputs.</small>
                            <input
                                v-model="agreeOverwriteText"
                                type="text"
                                class="form-control"
                                placeholder="Yes/Agree"
                            >
                        </div>
                        <div v-if="neutral == 'neutral'" class="row">
                            <input
                                v-model="neutralOverwriteText"
                                type="text"
                                class="form-control"
                                placeholder="Neutral"
                            >
                        </div>
                        <div class="row mb-3">
                            <input
                                v-model="disagreeOverwriteText"
                                type="text"
                                class="form-control"
                                placeholder="No/Disagree"
                            >
                        </div>
                    </template>
                </div>
            </div>
            <!-- link to content -->
            <div v-if="isContentReview" class="row mb-3">
                Content in ranked maps will not be changed unless it is severely inappropriate. Please focus reports on inappropriate songs or visuals from qualified or soon-to-be-qualified maps. For other maps, please use the beatmap report system on osu-web.
            </div>
            <div class="row mb-3">
                <small class="mb-1">{{ isContentReview ? 'Direct link to content (if image, URL should end in .jpg or .png)' : 'Link to relevant discussion (optional)' }}</small>
                <input
                    v-model="discussionLink"
                    type="text"
                    class="form-control"
                    placeholder="link..."
                >
            </div>
            <div class="row mb-3">
                <small class="mb-1">{{ isContentReview ? 'Beatmap link and/or additional information (optional)' : `Summarize the discussion's proposed change(s)` }}</small>
                <textarea
                    v-model="shortReason"
                    class="form-control"
                    :placeholder="isContentReview ? 'info...' : 'summary...'"
                    rows="3"
                />
            </div>

            <div v-if="isContentReview" class="row">
                <p>Video submission:</p>
                <div class="row ml-1">
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="content is NOT a video"
                    >
                        <input
                            v-model="videoStatus"
                            type="radio"
                            class="cross-radio hide-default"
                            name="isVideo"
                            value="noVideo"
                        >
                        <i class="fas fa-times fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="content is a video"
                    >
                        <input
                            v-model="videoStatus"
                            type="radio"
                            class="checkmark-radio hide-default"
                            name="isVideo"
                            value="isVideo"
                        >
                        <i class="fas fa-check fa-lg" />
                    </label>
                </div>
            </div>

            <small v-if="isContentReview" class="mb-3 row">If this is a video submission, you'll need to provide timestamps of the clips that need to be reviewed</small>

            <div v-if="isContentReview && isVideoSubmission" class="row mb-3">
                <small class="mb-1">Timestamps:</small>
                <textarea
                    v-model="timestamps"
                    class="form-control"
                    placeholder="timestamps..."
                    rows="3"
                />
            </div>

            <div v-if="!isContentReview" class="row mb-3">
                <small class="mb-1">Title for discussion vote</small>
                <input
                    v-model="title"
                    type="text"
                    class="form-control"
                    placeholder="title..."
                >
            </div>

            <hr>
            <button type="submit" class="btn btn-primary float-right" @click="submitDiscussion($event)">
                Submit
            </button>
        </div>
        <toast-messages />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import ModeSelect from '../ModeSelect.vue';
import ToastMessages from '../ToastMessages.vue';

export default {
    name: 'SubmitDiscussion',
    components: {
        ModalDialog,
        ModeSelect,
        ToastMessages,
    },
    data() {
        return {
            discussionLink: '',
            title: '',
            shortReason: '',
            mode: 'all',
            group: 'bn',
            neutral: 'noNeutral',
            reason: 'reason',
            contentReview: 'contentReview',
            customText: 'noCustomText',
            agreeOverwriteText: '',
            neutralOverwriteText: '',
            disagreeOverwriteText: '',
            videoStatus: '',
            timestamps: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {boolean} */
        isNatOnly () {
            return this.group == 'nat';
        },
        /** @returns {boolean} */
        neutralAllowed () {
            return this.neutral == 'neutral';
        },
        /** @returns {boolean} */
        reasonAllowed () {
            return this.reason == 'reason';
        },
        /** @returns {boolean} */
        isContentReview () {
            return this.contentReview == 'contentReview';
        },
        /** @returns {boolean} */
        customTextAllowed () {
            return this.customText == 'customText';
        },
        /** @returns {boolean} */
        isVideoSubmission () {
            return this.videoStatus == 'isVideo';
        },
    },
    methods: {
        async submitDiscussion(e) {
            if (this.isContentReview && !this.videoStatus.length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to specify if this is a video submission or not!',
                });
            }

            if (this.isContentReview && this.isVideoSubmission && !this.timestamps.length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to provide timestamps for video submissions!',
                });
            }

            const data = await this.$http.executePost(
                '/discussionVote/submit',
                {
                    discussionLink: this.discussionLink,
                    title: this.title,
                    shortReason: this.shortReason,
                    timestamps: this.timestamps,
                    mode: this.mode,
                    isNatOnly: this.isNatOnly,
                    neutralAllowed: this.neutralAllowed,
                    reasonAllowed: this.reasonAllowed,
                    isContentReview: this.isContentReview,
                    customText: this.customTextAllowed,
                    agreeOverwriteText: this.agreeOverwriteText,
                    neutralOverwriteText: this.neutralOverwriteText,
                    disagreeOverwriteText: this.disagreeOverwriteText,
                },
                e
            );

            if (this.$http.isValid(data)) {
                $('#addDiscussion').modal('hide');
                this.$store.commit('discussionVote/addDiscussionVote', data.discussion);
            }
        },
    },
};
</script>
