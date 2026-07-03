<template>
    <modal-dialog id="addDiscussion" :title="isContentReview ? 'Submit content for review' : 'Submit topic for vote/discussion'">
        <div class="container">
            <!-- title -->
            <div v-if="!isContentReview" class="row mb-2">
                <div class="col-sm-12">
                    <div>Title for discussion vote</div>
                    <input
                        v-model="title"
                        type="text"
                        class="form-control"
                        placeholder="title..."
                    >
                </div>
            </div>
            <!-- link -->
            <div class="row mb-2">
                <div class="col-sm-12">
                    <div v-if="isContentReview">
                        Direct link to content
                    </div>
                    <div v-else>
                        Link to relevant discussion
                    </div>
                    <div class="small text-secondary">
                        <div v-if="isContentReview">
                            If link is an image, the URL should end in <code>.jpg</code> or <code>.png</code>. Avoid Imgur if possible because it's blocked in some countries!
                        </div>
                        <div v-else>
                            Optional
                        </div>
                    </div>
                    <input
                        v-model="discussionLink"
                        type="text"
                        class="form-control"
                        placeholder="link..."
                    >
                </div>
            </div>
            <!-- video submission -->
            <div v-if="isContentReview" class="row mb-2">
                <div class="col-sm-12 d-flex align-items-center">
                    <div class="me-2">
                        Video submission:
                    </div>
                    <label
                        class="mx-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        :title="isVideoLink ? 'video detected from link' : 'content is NOT a video'"
                    >
                        <input
                            v-model="videoStatus"
                            type="radio"
                            class="cross-radio hide-default"
                            name="contentReviewIsVideo"
                            value="noVideo"
                            :disabled="isVideoLink"
                        >
                        <i class="fas fa-times fa-lg" />
                    </label>
                    <label
                        class="mx-1"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="content is a video"
                    >
                        <input
                            v-model="videoStatus"
                            type="radio"
                            class="checkmark-radio hide-default"
                            name="contentReviewIsVideo"
                            value="isVideo"
                        >
                        <i class="fas fa-check fa-lg" />
                    </label>
                </div>
            </div>
            <div v-if="isContentReview" class="row mb-2">
                <div class="col-sm-12 small text-secondary">
                    If this is a video submission, you'll need to provide timestamps of the clips that need to be reviewed.
                </div>
            </div>
            <div v-if="isContentReview && isVideoSubmission" class="row mb-2">
                <div class="col-sm-12">
                    <small class="mb-1">Timestamps: <span class="text-danger">*</span></small>
                    <textarea
                        v-model="timestamps"
                        class="form-control"
                        placeholder="timestamps..."
                        rows="3"
                        required
                    />
                </div>
            </div>
            <!-- information -->
            <div class="row mb-2">
                <div class="col-sm-12">
                    <div>{{ isContentReview ? 'Beatmap link and additional information' : `Context for vote/discussion` }}</div>
                    <div v-if="isContentReview" class="small text-secondary">
                        Any helpful information for reviewers
                    </div>
                    <div v-else class="small text-secondary">
                        Anything useful for people participating in this discussion
                    </div>
                    <textarea
                        v-model="shortReason"
                        class="form-control"
                        placeholder="info..."
                        rows="2"
                    />
                </div>
            </div>

            <!-- topic (NAT only) -->
            <div v-if="loggedInUser.isNat && !isContentReview">
                <!-- game mode selection -->
                <div class="d-flex align-items-center">
                    <div>Game mode</div>
                    <mode-select
                        v-model="mode"
                        :max-selection="1"
                        :all-modes="true"
                        class="ms-2"
                    />
                </div>
                <!-- who can participate -->
                <div class="d-flex flex-wrap align-items-center mt-2">
                    Who can participate:
                    <select
                        id="user"
                        v-model="group"
                        class="form-select form-select-sm ms-2 w-auto"
                    >
                        <option
                            value=""
                            disabled
                        >
                            Select a group
                        </option>
                        <option
                            value="nat"
                        >
                            NAT
                        </option>
                        <option
                            value="bnNat"
                        >
                            BN + NAT
                        </option>
                    </select>
                </div>
                <!-- who can participate -->
                <div class="d-flex flex-wrap align-items-center mt-2">
                    Number of vote options:
                    <select
                        id="vote-options"
                        v-model="voteOptions"
                        class="form-select form-select-sm ms-2 w-auto"
                    >
                        <option
                            value=""
                            disabled
                        >
                            Select a number
                        </option>
                        <option
                            :value="0"
                        >
                            0 (only written input)
                        </option>
                        <option
                            :value="2"
                        >
                            2
                        </option>
                        <option
                            :value="3"
                        >
                            3
                        </option>
                    </select>
                </div>
                <!-- custom vote text -->
                <div v-if="voteOptions >= 2" class="mt-1">
                    <div>Replace option text</div>
                    <div class="small text-secondary">
                        Default option text will replace any empty inputs
                    </div>
                    <input
                        v-model="agreeOverwriteText"
                        type="text"
                        class="form-control"
                        placeholder="Yes/Agree"
                    >
                    <input
                        v-if="voteOptions === 3"
                        v-model="neutralOverwriteText"
                        type="text"
                        class="form-control"
                        placeholder="Neutral"
                    >
                    <input
                        v-model="disagreeOverwriteText"
                        type="text"
                        class="form-control"
                        placeholder="No/Disagree"
                    >
                </div>
            </div>

            <!-- submit -->
            <hr>
            <div class="row">
                <div v-if="isContentReview" class="col-sm-10 mb-3 text-secondary small">
                    Only submit inappropriate backgrounds or videos from qualified or soon-to-be-qualified maps. For Ranked or Graveyard maps, use the beatmap report system on osu-web.
                </div>
                <div :class="isContentReview ? 'col-sm-2' : 'col-sm-12'">
                    <button type="submit" class="btn btn-primary float-end" @click="submitDiscussion($event)">
                        Submit
                    </button>
                </div>
            </div>
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
    props: {
        isContentReview: {
            type: Boolean,
            required: true,
        },
        storeModule: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            title: '',
            discussionLink: '',
            shortReason: '',
            mode: '',
            group: '',
            voteOptions: null,
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
            return this.group === 'nat';
        },
        isVideoSubmission () {
            return this.videoStatus === 'isVideo';
        },
        isVideoLink () {
            if (!this.isContentReview) return false;

            return this.resolveDiscussionContentType(this.discussionLink) === 'video';
        },
    },
    watch: {
        discussionLink (newLink) {
            this.syncVideoStatusFromLink(newLink);
        },
        videoStatus (newStatus) {
            if (this.isVideoLink && newStatus !== 'isVideo') {
                this.videoStatus = 'isVideo';
            }
        },
    },
    methods: {
        syncVideoStatusFromLink (link) {
            if (!this.isContentReview) return;

            if (this.resolveDiscussionContentType(link) === 'video') {
                this.videoStatus = 'isVideo';
            }
        },
        async submitDiscussion(e) {
            if (this.isContentReview && !this.videoStatus.length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to specify if this is a video submission or not!',
                });
            }

            if (this.isContentReview && this.isVideoSubmission && !this.timestamps.trim().length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to provide timestamps for video submissions!',
                });
            }

            let missingInfo;

            if (this.isContentReview && (!this.discussionLink || !this.shortReason)) {
                missingInfo = true;
            } else if (!this.isContentReview && (!this.title || !this.shortReason || !this.mode.length || !this.group.length || this.voteOptions === null)) {
                missingInfo = true;
            }



            if (missingInfo) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'Missing info!',
                });
            }

            const data = await this.$http.executePost(
                '/discussionVote/submit',
                {
                    discussionLink: this.discussionLink,
                    title: this.title,
                    shortReason: this.shortReason.concat(
                        this.timestamps.trim().length ? `\n\n**Timestamps:**\n${this.timestamps.trim()}` : ''
                    ),
                    mode: this.isContentReview ? 'all' : this.mode,
                    isNatOnly: this.isNatOnly,
                    neutralAllowed: this.voteOptions === 3,
                    onlyWrittenInput: this.voteOptions === 0,
                    isContentReview: this.isContentReview,
                    customText: this.agreeOverwriteText.length || this.neutralOverwriteText.length || this.disagreeOverwriteText.length,
                    agreeOverwriteText: this.agreeOverwriteText,
                    neutralOverwriteText: this.neutralOverwriteText,
                    disagreeOverwriteText: this.disagreeOverwriteText,
                },
                e
            );

            if (this.$http.isValid(data)) {
                $('#addDiscussion').modal('hide');
                this.$store.commit(`${this.storeModule}/addDiscussion`, data.discussion);
            }
        },
    },
};
</script>
