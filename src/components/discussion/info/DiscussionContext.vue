<template>
    <div class="container text-shadow">
        <p v-if="discussionLink.length" class="min-spacing mb-2">
            <a :href="discussionLink" target="_blank">Read and contribute to the full discussion here</a>
        </p>
        <p v-if="isCreator" class="min-spacing">
            Title:
            <input
                v-if="isEditTitle"
                v-model="editTitleContent"
                class="small w-50"
                type="text"
                placeholder="title..."
            >
            <span v-else class="small">{{ title }}</span>
            <a
                href="#"
                data-toggle="tooltip"
                data-placement="top"
                title="edit title"
                @click.prevent="isEditTitle ? saveTitle() : '', isEditTitle = !isEditTitle, editTitleContent = title"
            ><i class="fas fa-edit" /></a>
        </p>
        <p>
            Proposal:
            <span v-if="isEditProposal" class="d-flex">
                <textarea
                    v-model="editNoteComment"
                    placeholder="edit user note..."
                    class="form-control dark-textarea mr-2"
                    style="white-space: pre-line;"
                    rows="2"
                />
                <button class="btn btn-sm btn-nat align-self-center" @click="editNote($event)">
                    Edit
                </button>
            </span>
            <span v-else class="small" v-html="filterLinks(shortReason)" />
        </p>
        
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'DiscussionContext',
    mixins: [ filterLinks ],
    props: {
        discussionLink: String,
        isCreator: Boolean,
        title: String,
        shortReason: String,
    },
    data() {
        return {
            isEditTitle: false,
            editTitleContent: '',
            isEditProposal: false,
            editProposalContent: '',

        };
    },
};
</script>