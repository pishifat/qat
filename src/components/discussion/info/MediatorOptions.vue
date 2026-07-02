<template>
    <div>
        <div class="mb-2">
            <!-- VCC violations checkbox -->
            <div v-if="!selectedDiscussion.onlyWrittenInput && isContentReview && vote == 3">
                <hr>
                Select the <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a> that are violated:
                <div v-for="(option, i) in vccOptions" :key="i" class="form-check ms-4">
                    <div v-if="option.active">
                        <input
                            :id="option.name"
                            :key="i"
                            v-model="vccChecked"
                            class="form-check-input"
                            type="checkbox"
                            name="violation"
                            :value="option.name"
                        >
                        <label class="form-check-label" :for="option.name">{{ option.text }}</label>
                    </div>
                </div>
            </div>

            <hr>

            <!-- comment -->
            <textarea
                id="comment"
                v-model="comment"
                class="form-control"
                :placeholder="commentRequired ? 'your thoughts... (required)' : 'your thoughts... (optional)'"
                rows="2"
            />

            <!-- vote -->
            <div v-if="!selectedDiscussion.onlyWrittenInput" class="mt-2">
                <div class="d-flex flex-wrap align-items-center justify-content-end">
                    <div class="form-check form-check-inline">
                        <input
                            id="1"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="1"
                        >
                        <label class="form-check-label text-pass" for="1">{{ selectedDiscussion.agreeOverwriteText ? selectedDiscussion.agreeOverwriteText : 'Yes/Agree' }}</label>
                    </div>
                    <div v-if="selectedDiscussion.neutralAllowed" class="form-check form-check-inline">
                        <input
                            id="2"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="2"
                        >
                        <label class="form-check-label text-neutral" for="2">{{ selectedDiscussion.neutralOverwriteText ? selectedDiscussion.neutralOverwriteText : 'Neutral' }}</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input
                            id="3"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="3"
                        >
                        <label class="form-check-label text-fail" for="3">{{ selectedDiscussion.disagreeOverwriteText ? selectedDiscussion.disagreeOverwriteText : 'No/Disagree' }}</label>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-end mt-2">
                <button
                    class="btn btn-sm btn-primary"
                    :disabled="isSubmitDisabled"
                    @click="submitMediation($event)"
                >
                    Submit
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import discussionStoreMixin from '../../../mixins/discussionStore';
import enums from 'shared/enums';
const { VisualContentConsiderations } = enums;

export default {
    name: 'MediatorOptions',
    mixins: [discussionStoreMixin],
    props: {
        isContentReview: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            vote: null,
            comment: null,
            mediationId: null,
            vccOptions: VisualContentConsiderations,
            vccChecked: [],
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        commentRequired() {
            return this.vote == 3 && this.vccChecked.includes('other');
        },
        isSubmitDisabled() {
            if (!this.isContentReview) return false;
            if (!this.vote) return true;
            if (this.vote == 3 && !this.vccChecked.length) return true;
            if (this.commentRequired && !this.comment?.trim()) return true;
            return false;
        },
    },
    watch: {
        selectedDiscussion() {
            this.findUserMediation();
        },
    },
    mounted() {
        this.findUserMediation();
    },
    methods: {
        findUserMediation() {
            this.vote = null;
            this.comment = null;
            this.mediationId = null;
            this.vccChecked = [];

            if (this.selectedDiscussion.mediations.length) {
                for (const mediation of this.selectedDiscussion.mediations) {
                    if (mediation.mediator && mediation.mediator.id == this.loggedInUser.id) {
                        if (mediation.vote) this.vote = mediation.vote;
                        if (mediation.comment) this.comment = mediation.comment;
                        this.mediationId = mediation.id;
                        if (mediation.vccChecked && mediation.vccChecked.length) this.vccChecked = mediation.vccChecked;
                        break;
                    }
                }
            }
        },
        async submitMediation (e) {
            const data = await this.$http.executePost(
                '/discussionVote/submitMediation/' + this.selectedDiscussion.id, {
                    vote: this.vote,
                    comment: this.comment,
                    vccChecked: this.vccChecked,
                }, e);

            if (this.$http.isValid(data)) {
                this.updateDiscussionInStore(data.discussion);
            }
        },
    },
};
</script>