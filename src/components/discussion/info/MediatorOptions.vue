<template>
    <div>
        <div class="mb-2">
            <!-- comment -->
            <textarea
                id="comment"
                v-model="comment"
                class="form-control"
                placeholder="your thoughts... (optional)"
                rows="2"
            />

            <!-- vote -->
            <div v-if="!selectedDiscussionVote.onlyWrittenInput" class="mt-2">
                <div class="form-inline justify-content-end">
                    <div class="form-check form-check-inline">
                        <input
                            id="1"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="1"
                        >
                        <label class="form-check-label text-pass" for="1">{{ selectedDiscussionVote.agreeOverwriteText ? selectedDiscussionVote.agreeOverwriteText : 'Yes/Agree' }}</label>
                    </div>
                    <div v-if="selectedDiscussionVote.neutralAllowed" class="form-check form-check-inline">
                        <input
                            id="2"
                            v-model="vote"
                            class="form-check-input"
                            type="radio"
                            name="vote"
                            value="2"
                        >
                        <label class="form-check-label text-neutral" for="2">{{ selectedDiscussionVote.neutralOverwriteText ? selectedDiscussionVote.neutralOverwriteText : 'Neutral' }}</label>
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
                        <label class="form-check-label text-fail" for="3">{{ selectedDiscussionVote.disagreeOverwriteText ? selectedDiscussionVote.disagreeOverwriteText : 'No/Disagree' }}</label>
                    </div>
                </div>

                <div v-if="isContentReview && vote == 3">
                    Select the <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a> that are violated:
                    <div class="form-check ml-4" v-for="(option, i) in vccOptions" :key="i">
                        <div v-if="option.active">
                            <input
                                :key="i"
                                :id="option.name"
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
            </div>

            <div class="d-flex justify-content-end mt-2">
                <button
                    class="btn btn-sm btn-primary"
                    @click="submitMediation($event)"
                    :disabled="isContentReview && (!vote || (vote == 3 && !vccChecked.length))"
                >
                    Submit
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { VisualContentConsiderations } from '../../../../shared/enums.js';

export default {
    name: 'MediatorOptions',
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
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
    },
    watch: {
        selectedDiscussionVote() {
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

            if (this.selectedDiscussionVote.mediations.length) {
                for (const mediation of this.selectedDiscussionVote.mediations) {
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
                '/discussionVote/submitMediation/' + this.selectedDiscussionVote.id, {
                    vote: this.vote,
                    comment: this.comment,
                    vccChecked: this.vccChecked,
                }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('discussionVote/updateDiscussionVote', data.discussion);
            }
        },
    },
};
</script>