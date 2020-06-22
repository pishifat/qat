<template>
    <div>
        <p v-if="selectedDiscussionVote.discussionLink.length" class="mb-2">
            <a :href="selectedDiscussionVote.discussionLink" target="_blank">Read and contribute to the full discussion here</a>
        </p>

        <p v-if="isEditable">
            <a
                href="#"
                data-toggle="tooltip"
                data-placement="top"
                title="edit title"
                @click.prevent="isEditingTitle ? update() : isEditingTitle = true"
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
                @click.prevent="isEditingProposal ? update() : isEditingProposal = true"
            >
                <i class="fas fa-edit" />
            </a>

            <b>Proposal:</b>

            <input
                v-if="isEditingProposal"
                v-model="editProposalContent"
                class="form-control form-control-sm w-75"
                type="text"
                placeholder="enter to submit new proposal..."
                @keyup.enter="update()"
            >

            <span v-else class="small" v-html="$md.render(selectedDiscussionVote.shortReason)" />
        </p>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'DiscussionContext',
    mixins: [ postData ],
    data() {
        return {
            isEditingTitle: false,
            editTitleContent: '',
            isEditingProposal: false,
            editProposalContent: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
        isEditable() {
            return this.loggedInUser.isNat &&
                this.selectedDiscussionVote.creator == this.loggedInUser.id &&
                this.selectedDiscussionVote.isActive;
        },
    },
    watch: {
        selectedDiscussionVote () {
            this.isEditingTitle = false;
            this.editTitleContent = this.selectedDiscussionVote.title;
            this.isEditingProposal = false;
            this.editProposalContent = this.selectedDiscussionVote.shortReason;
        },
    },
    created () {
        if (this.selectedDiscussionVote) {
            this.editTitleContent = this.selectedDiscussionVote.title;
            this.editProposalContent = this.selectedDiscussionVote.shortReason;
        }
    },
    methods: {
        async update () {
            const discussionVote = await this.executePost(
                `/discussionVote/${this.selectedDiscussionVote.id}/update`, {
                    title: this.editTitleContent,
                    shortReason: this.editProposalContent,
                });

            if (discussionVote && !discussionVote.error) {
                this.$store.commit('discussionVote/updateDiscussionVote', discussionVote);
                this.$store.dispatch('updateToastMessages', {
                    message: `Updated`,
                    type: 'info',
                });

                this.isEditingTitle = false;
                this.isEditingProposal = false;
            }
        },
    },
};
</script>
