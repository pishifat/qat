<template>
    <div>
        <div v-if="selectedDiscussion.isContentReview">
            <div
                v-if="isEditable"
            >
                <a
                    href="#"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="edit link"
                    @click.prevent="editLink"
                >
                    <i class="fas fa-edit" />
                </a>

                <b>Direct link:</b>

                <input
                    v-if="isEditingLink"
                    v-model="editLinkContent"
                    class="form-control form-control-sm w-50 mb-2"
                    type="text"
                    placeholder="enter to submit new link..."
                    @keyup.enter="update()"
                >

                <span v-else-if="safeDiscussionLink" class="small" v-html="$md.render(safeDiscussionLink)" />
                <span v-else class="small text-secondary">Invalid URL</span>
            </div>
            <div
                v-if="youtubeVideoId"
                class="ratio ratio-16x9 mb-2 discussion-youtube-embed"
            >
                <iframe
                    :src="youtubeEmbedUrl"
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                />
            </div>
            <img v-else-if="isImage" class="img-responsive fit-image mb-2" :src="proxyImageLink">
        </div>
        <p v-else-if="!selectedDiscussion.isContentReview && safeDiscussionLink" class="mb-2">
            <a :href="safeDiscussionLink" target="_blank" rel="noopener noreferrer">Read and contribute to the full discussion here</a>
        </p>

        <p v-if="isEditable && !selectedDiscussion.isContentReview">
            <a
                href="#"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="edit title"
                @click.prevent="editTitle"
            >
                <i class="fas fa-edit" />
            </a>

            <b>Title:</b>

            <input
                v-if="isEditingTitle"
                v-model="editTitleContent"
                class="form-control form-control-sm w-50"
                type="text"
                placeholder="enter to submit new title..."
                @keyup.enter="update()"
            >

            <span v-else class="small">{{ selectedDiscussion.title }}</span>
        </p>

        <p>
            <a
                v-if="isEditable"
                href="#"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="edit title"
                @click.prevent="editProposal"
            >
                <i class="fas fa-edit" />
            </a>

            <b>Topic:</b>

            <textarea
                v-if="isEditingProposal"
                v-model="editProposalContent"
                class="form-control form-control-sm w-75"
                placeholder="enter to submit new proposal..."
                rows="3"
            />

            <span v-else class="small" v-html="$md.render(selectedDiscussion.shortReason)" />
        </p>

        <p v-if="isEditable && !selectedDiscussion.isContentReview">
            <a
                href="#"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="edit title"
                @click.prevent="editOptions"
            >
                <i class="fas fa-edit" />
            </a>

            <b>Voting options:</b>

            <input
                v-if="isEditingOptions"
                v-model="agreeOverwriteTextEditContent"
                class="form-control form-control-sm w-50"
                type="text"
                placeholder="submit custom agree option..."
                @keyup.enter="update()"
            >
            <input
                v-if="isEditingOptions && selectedDiscussion.neutralAllowed"
                v-model="neutralOverwriteTextEditContent"
                class="form-control form-control-sm w-50"
                type="text"
                placeholder="submit custom neutral option..."
                @keyup.enter="update()"
            >
            <input
                v-if="isEditingOptions"
                v-model="disagreeOverwriteTextEditContent"
                class="form-control form-control-sm w-50"
                type="text"
                placeholder="submit custom disagree option..."
                @keyup.enter="update()"
            >

            <input
                v-if="isEditingOptions"
                id="neutralAllowedEdit"
                v-model="neutralAllowedEdit"
                type="checkbox"
                class="mt-2"
                @change="update()"
            >
            <label
                v-if="isEditingOptions"
                for="neutralAllowedEdit"
                class="form-check-label text-secondary"
            >
                Neutral option allowed
            </label>

            <ul v-else class="small">
                <li>{{ selectedDiscussion.agreeOverwriteText || 'Yes/Agree' }}</li>
                <li v-if="selectedDiscussion.neutralAllowed">
                    {{ selectedDiscussion.neutralOverwriteText || 'Neutral' }}
                </li>
                <li>{{ selectedDiscussion.disagreeOverwriteText || 'No/Disagree' }}</li>
            </ul>
        </p>

        <div v-if="selectedDiscussion.isContentReview && !selectedDiscussion.isActive">
            <b>Consensus:</b>
            <span :class="selectedDiscussion.isAcceptable == true ? 'text-success' : selectedDiscussion.isAcceptable == false ? 'text-danger' : 'text-secondary'">
                {{ selectedDiscussion.isAcceptable == true ? 'Pass' : selectedDiscussion.isAcceptable == false ? 'Fail' : 'Unknown' }}
            </span>
            <span v-if="loggedInUser.hasFullReadAccess && !selectedDiscussion.isAcceptable && selectedDiscussion.isAcceptable != false" class="btn-group">
                <button
                    class="btn btn-sm btn-success"
                    @click="setIsAcceptable(true, $event);"
                >
                    Pass
                </button>
                <button
                    class="btn btn-sm btn-danger"
                    @click="setIsAcceptable(false, $event);"
                >
                    Fail
                </button>
            </span>
        </div>

        <div v-if="selectedDiscussion.isContentReview && selectedDiscussion.isActive">
            <b>Content review notes:</b>
            <div class="small">
                <ul>
                    <li>Explicit Content label is for <i>song</i> content <b>only</b>. If you think a song is acceptable only with an Explicit Content label, mention it in the text input below.</li>
                    <li>Videos, SBs, BGs, Skin elements, <b>must</b> abide by <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a> or they can't be ranked. The explicit content filter will <b>not</b> allow riskier visual content to get ranked in present time.</li>
                    <li>Do not vote <i>yes</i> for visual stuff if you think it should have an explicit content label. That would be a <i>no</i>.</li>
                    <li>Do not vote if you haven't even seen the content! If there's issues with it being region locked or otherwise not visible, let a NAT member know so we can mirror it and re-run the vote.</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import discussionStoreMixin from '../../../mixins/discussionStore';

export default {
    name: 'DiscussionContext',
    mixins: [discussionStoreMixin],
    data() {
        return {
            isEditingTitle: false,
            editTitleContent: '',
            isEditingProposal: false,
            editProposalContent: '',
            isEditingLink: false,
            editLinkContent: '',
            isEditingOptions: false,
            agreeOverwriteTextEditContent: '',
            neutralOverwriteTextEditContent: '',
            disagreeOverwriteTextEditContent: '',
            neutralAllowedEdit: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {string|null} */
        safeDiscussionLink() {
            return this.sanitizeUrl(this.selectedDiscussion?.discussionLink);
        },
        /** @returns {boolean} */
        isEditable() {
            const creatorId = this.selectedDiscussion.creator?.id || this.selectedDiscussion.creator?._id;
            return this.selectedDiscussion.isActive &&
                ((!this.selectedDiscussion.isContentReview && (creatorId == this.loggedInUser.id || this.loggedInUser.isNatLeader)) ||
                (this.selectedDiscussion.isContentReview && (this.loggedInUser.groups.includes('nat') || this.loggedInUser.groups.includes('gmt'))));
        },
        /** @returns {boolean} */
        isImage() {
            return this.isDiscussionImageUrl(this.safeDiscussionLink);
        },
        proxyImageLink() {
            const imageUrl = this.resolveDiscussionImageUrl(this.safeDiscussionLink);
            return imageUrl ? this.proxyUrl(imageUrl) : null;
        },
        youtubeVideoId() {
            return this.extractYoutubeVideoId(this.safeDiscussionLink);
        },
        youtubeEmbedUrl() {
            return this.youtubeVideoId
                ? `https://www.youtube-nocookie.com/embed/${this.youtubeVideoId}`
                : null;
        },
    },
    watch: {
        selectedDiscussion () {
            this.isEditingTitle = false;
            this.editTitleContent = this.selectedDiscussion.title;
            this.isEditingProposal = false;
            this.editProposalContent = this.selectedDiscussion.shortReason;
            this.isEditingLink = false;
            this.editLinkContent = this.selectedDiscussion.discussionLink;
            this.isEditingOptions = false;
            this.agreeOverwriteTextEditContent = this.selectedDiscussion.agreeOverwriteText;
            this.neutralOverwriteTextEditContent = this.selectedDiscussion.neutralOverwriteText;
            this.disagreeOverwriteTextEditContent = this.selectedDiscussion.disagreeOverwriteText;
            this.neutralAllowedEdit = this.selectedDiscussion.neutralAllowed;
        },
    },
    created () {
        if (this.selectedDiscussion) {
            this.editTitleContent = this.selectedDiscussion.title;
            this.editProposalContent = this.selectedDiscussion.shortReason;
            this.editLinkContent = this.selectedDiscussion.discussionLink;
            this.agreeOverwriteTextEditContent = this.selectedDiscussion.agreeOverwriteText;
            this.neutralOverwriteTextEditContent = this.selectedDiscussion.neutralOverwriteText;
            this.disagreeOverwriteTextEditContent = this.selectedDiscussion.disagreeOverwriteText;
            this.neutralAllowedEdit = this.selectedDiscussion.neutralAllowed;
        }
    },
    methods: {
        editLink () {
            if (this.isEditingLink) {
                this.update();
            } else {
                this.isEditingLink = true;
            }
        },
        editTitle () {
            if (this.isEditingTitle) {
                this.update();
            } else {
                this.isEditingTitle = true;
            }
        },
        editProposal () {
            if (this.isEditingProposal) {
                this.update();
            } else {
                this.isEditingProposal = true;
            }
        },
        editOptions () {
            if (this.isEditingOptions) {
                this.update();
            } else {
                this.isEditingOptions = true;
            }
        },
        async update () {
            const data = await this.$http.executePost(
                `/discussionVote/${this.selectedDiscussion.id}/update`, {
                    title: this.editTitleContent,
                    shortReason: this.editProposalContent,
                    discussionLink: this.editLinkContent,
                    agreeOverwriteText: this.agreeOverwriteTextEditContent,
                    neutralOverwriteText: this.neutralOverwriteTextEditContent,
                    disagreeOverwriteText: this.disagreeOverwriteTextEditContent,
                    neutralAllowed: this.neutralAllowedEdit,
                });

            if (this.$http.isValid(data)) {
                this.updateDiscussionInStore(data.discussion);

                this.isEditingTitle = false;
                this.isEditingProposal = false;
                this.isEditingLink = false;
            }
        },
        async setIsAcceptable (isAcceptable, e) {
            const data = await this.$http.executePost(
                `/discussionVote/${this.selectedDiscussion.id}/setIsAcceptable`, {
                    isAcceptable,
                }, e);

            if (this.$http.isValid(data)) {
                this.updateDiscussionInStore(data.discussion);
            }
        },
    },
};
</script>

<style>

.fit-image{
    width: 100%;
    object-fit: cover;
}

.discussion-youtube-embed iframe {
    border: 0;
}

</style>
