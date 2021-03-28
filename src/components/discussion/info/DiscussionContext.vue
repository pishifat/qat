<template>
    <div>
        <div v-if="selectedDiscussionVote.isContentReview">
            <div
                v-if="isEditable"
            >
                <a
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
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

                <span v-else class="small" v-html="$md.render(selectedDiscussionVote.discussionLink)" />
            </div>
            <img v-if="isImage" class="img-responsive fit-image mb-2" :src="selectedDiscussionVote.discussionLink">
        </div>
        <p v-else-if="!selectedDiscussionVote.isContentReview && selectedDiscussionVote.discussionLink" class="mb-2">
            <a :href="selectedDiscussionVote.discussionLink" target="_blank">Read and contribute to the full discussion here</a>
        </p>

        <p v-if="isEditable && !selectedDiscussionVote.isContentReview">
            <a
                href="#"
                data-toggle="tooltip"
                data-placement="top"
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

            <span v-else class="small">{{ selectedDiscussionVote.title }}</span>
        </p>

        <p>
            <a
                v-if="isEditable"
                href="#"
                data-toggle="tooltip"
                data-placement="top"
                title="edit title"
                @click.prevent="editProposal"
            >
                <i class="fas fa-edit" />
            </a>

            <b>Question/Proposal:</b>

            <textarea
                v-if="isEditingProposal"
                v-model="editProposalContent"
                class="form-control form-control-sm w-75"
                placeholder="enter to submit new proposal..."
                rows="3"
            />

            <span v-else class="small" v-html="$md.render(selectedDiscussionVote.shortReason)" />
        </p>

        <div v-if="selectedDiscussionVote.isContentReview">
            <b>Content review notes:</b>
            <div class="small">
                <ul>
                    <li>Explicit Content label is for <i>song</i> content <b>only</b>. If you think a song is acceptable only with an Explicit Content label, mention it in the text input below.</li>
                    <li>Videos, SBs, BGs, Skin elements, <b>must</b> abide by <a href="https://osu.ppy.sh/wiki/en/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a> or they can't be ranked. The explicit content filter will <b>not</b> allow riskier visual content to get ranked in present time.</li>
                    <li>Do not vote <i>yes</i> for visual stuff if you think it should have an explicit content label. That would be a <i>no</i>.</li>
                    <li>Do not vote if you haven't even seen the content! If there's issues with it being region locked or otherwise not visible, let a NAT know so we can mirror it and re-run the vote.</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'DiscussionContext',
    data() {
        return {
            isEditingTitle: false,
            editTitleContent: '',
            isEditingProposal: false,
            editProposalContent: '',
            isEditingLink: false,
            editLinkContent: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
        /** @returns {boolean} */
        isEditable() {
            return this.selectedDiscussionVote.isActive &&
                ((!this.selectedDiscussionVote.isContentReview && this.selectedDiscussionVote.creator == this.loggedInUser.id && this.selectedDiscussionVote.isActive) ||
                (this.selectedDiscussionVote.isContentReview && (this.loggedInUser.groups.includes('nat') || this.loggedInUser.groups.includes('gmt'))));
        },
        /** @returns {boolean} */
        isImage() {
            return (this.selectedDiscussionVote.discussionLink.match(/\.(jpeg|jpg|gif|png)$/) != null);
        },
    },
    watch: {
        selectedDiscussionVote () {
            this.isEditingTitle = false;
            this.editTitleContent = this.selectedDiscussionVote.title;
            this.isEditingProposal = false;
            this.editProposalContent = this.selectedDiscussionVote.shortReason;
            this.isEditingLink = false;
            this.editLinkContent = this.selectedDiscussionVote.discussionLink;
        },
    },
    created () {
        if (this.selectedDiscussionVote) {
            this.editTitleContent = this.selectedDiscussionVote.title;
            this.editProposalContent = this.selectedDiscussionVote.shortReason;
            this.editLinkContent = this.selectedDiscussionVote.discussionLink;
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
        async update () {
            const data = await this.$http.executePost(
                `/discussionVote/${this.selectedDiscussionVote.id}/update`, {
                    title: this.editTitleContent,
                    shortReason: this.editProposalContent,
                    discussionLink: this.editLinkContent,
                });

            if (this.$http.isValid(data)) {
                this.$store.commit('discussionVote/updateDiscussionVote', data.discussion);

                this.isEditingTitle = false;
                this.isEditingProposal = false;
                this.isEditingLink = false;
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

</style>
