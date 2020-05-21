<template>
    <div>
        <p v-if="selectedDiscussionVote.discussionLink.length" class="min-spacing mb-2">
            <a :href="selectedDiscussionVote.discussionLink" target="_blank">Read and contribute to the full discussion here</a>
        </p>
        <p v-if="isEditable" class="min-spacing">
            <a
                href="#"
                data-toggle="tooltip"
                data-placement="top"
                title="edit title"
                @click.prevent="isEditTitle ? saveTitle() : isEditTitle = true"
            ><i class="fas fa-edit" /></a>
            Title:
            <input
                v-if="isEditTitle"
                v-model="editTitleContent"
                class="small w-50"
                type="text"
                placeholder="enter to submit new title..."
                @keyup.enter="saveTitle()"
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
                @click.prevent="isEditProposal ? saveProposal() : isEditProposal = true"
            ><i class="fas fa-edit" /></a>
            Proposal:
            <input
                v-if="isEditProposal"
                v-model="editProposalContent"
                class="small w-75"
                type="text"
                placeholder="enter to submit new proposal..."
                @keyup.enter="saveProposal()"
            >
            <span v-else class="small" v-html="filterLinks(selectedDiscussionVote.shortReason)" />
        </p>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'DiscussionContext',
    mixins: [ postData, filterLinks ],
    data() {
        return {
            isEditTitle: false,
            editTitleContent: this.title,
            isEditProposal: false,
            editProposalContent: this.shortReason,
        };
    },
    computed: {
        ...mapState([
            'userId',
        ]),
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
        isEditable() {
            return this.selectedDiscussionVote.creator == this.userId && this.selectedDiscussionVote.isActive;
        },
    },
    watch: {
        selectedDiscussionVote () {
            this.isEditTitle = false;
            this.editTitleContent = this.selectedDiscussionVote.title;
            this.isEditProposal = false;
            this.editProposalContent = this.selectedDiscussionVote.shortReason;
        },
    },
    methods: {
        async saveTitle () {
            const discussionVote = await this.executePost(
                '/discussionVote/saveTitle/' + this.selectedDiscussionVote.id, { title: this.editTitleContent });

            if (discussionVote && !discussionVote.error) {
                this.$store.dispatch('updateDiscussionVote', discussionVote);
                this.$store.dispatch('updateToastMessages', {
                    message: `saved title`,
                    type: 'info',
                });
                this.isEditTitle = !this.isEditTitle;
            }
        },
        async saveProposal () {
            const discussionVote = await this.executePost(
                '/discussionVote/saveProposal/' + this.selectedDiscussionVote.id , { shortReason: this.editProposalContent });

            if (discussionVote && !discussionVote.error) {
                this.$store.dispatch('updateDiscussionVote', discussionVote);
                this.$store.dispatch('updateToastMessages', {
                    message: `saved proposal`,
                    type: 'info',
                });
                this.isEditProposal = !this.isEditProposal;
            }
        },
    },
};
</script>