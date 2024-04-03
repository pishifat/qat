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
                    <div v-if="isContentReview">Direct link to content</div>
                    <div v-else>Link to relevant discussion</div>
                    <div class="small text-secondary">
                        <div v-if="isContentReview">If link is an image, the URL should end in .jpg or .png</div>
                        <div v-else>Optional</div>
                    </div>
                    <input
                        v-model="discussionLink"
                        type="text"
                        class="form-control"
                        placeholder="link..."
                    >
                </div>
            </div>
            <!-- information -->
            <div class="row mb-2">
                <div class="col-sm-12">
                    <div>{{ isContentReview ? 'Beatmap link and additional information' : `Context for vote/discussion` }}</div>
                    <div v-if="isContentReview" class="small text-secondary">If this is a video submission, provide timestamps for the section that needs to be reviewed</div>
                    <div v-else class="small text-secondary">Anything useful for people participating in this discussion</div>
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
                    <div>Game mode:</div>
                    <mode-select
                        v-model="mode"
                        :max-selection="1"
                        :all-modes="true"
                        class="ml-2"
                    />
                </div>
                <!-- who can participate -->
                <div class="form-inline">
                    Who can participate:
                    <select
                        id="user"
                        v-model="group"
                        class="form-control form-control-sm ml-2"
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
                <div class="form-inline">
                    Number of vote options:
                    <select
                        id="user"
                        v-model="voteOptions"
                        class="form-control form-control-sm ml-2"
                    >
                        <option
                            :value="null"
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
                    <div class="small text-secondary">Default option text will replace any empty inputs</div>
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
                    Only submit inappropriate songs or visuals from qualified or soon-to-be-qualified maps. For Ranked or Graveyard maps, use the beatmap report system on osu-web.
                </div>
                <div :class="isContentReview ? 'col-sm-2' : 'col-sm-12'">
                    <button type="submit" class="btn btn-primary float-right" @click="submitDiscussion($event)">
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
    },
    methods: {
        async submitDiscussion(e) {
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
                    shortReason: this.shortReason,
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
                this.$store.commit('discussionVote/addDiscussionVote', data.discussion);
            }
        },
    },
};
</script>
