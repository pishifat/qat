<template>
    <div>
        <p v-if="discussionLink.length" class="min-spacing mb-2">
            <a :href="discussionLink" target="_blank">Read and contribute to the full discussion here</a>
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
            <span v-else class="small">{{ title }}</span>
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
            <span v-else class="small" v-html="filterLinks(shortReason)" />
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'DiscussionContext',
    mixins: [ postData, filterLinks ],
    props: {
        discussionId: {
            type: String,
            required: true,
        },
        discussionLink: {
            type: String,
            default() {
                return null;
            },
        },
        isEditable: Boolean,
        title: {
            type: String,
            required: true,
        },
        shortReason: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            isEditTitle: false,
            editTitleContent: this.title,
            isEditProposal: false,
            editProposalContent: this.shortReason,
        };
    },
    watch: {
        discussionId () {
            this.isEditTitle = false;
            this.editTitleContent = this.title;
            this.isEditProposal = false;
            this.editProposalContent = this.shortReason;
        },
    },
    methods: {
        async saveTitle () {
            const d = await this.executePost(
                '/discussionVote/saveTitle/' + this.discussionId, { title: this.editTitleContent });

            if (d) {
                if (d.error) {
                    this.info = d.error;
                } else {
                    this.$emit('update-discussion', d);
                    this.isEditTitle = !this.isEditTitle;
                }
            }
        },
        async saveProposal () {
            const d = await this.executePost(
                '/discussionVote/saveProposal/' + this.discussionId, { shortReason: this.editProposalContent });

            if (d) {
                if (d.error) {
                    this.info = d.error;
                } else {
                    this.$emit('update-discussion', d);
                    this.isEditProposal = !this.isEditProposal;
                }
            }
        },
    },
};
</script>