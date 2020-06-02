<template>
    <div>
        <textarea
            v-model="comment"
            placeholder="new user note..."
            class="form-control"
            rows="2"
        />

        <button class="btn btn-nat btn-block btn-sm" @click="saveNote($event)">
            Save
        </button>

        <ul class="mt-2">
            <li v-if="!notes" class="small">
                ...
            </li>
            <li v-else-if="!notes.length" class="small">
                User has no notes
            </li>
            <li
                v-for="note in notes"
                v-else
                :key="note.id"
                class="small"
            >
                <b>
                    {{ note.updatedAt.slice(0,10) }} -
                    <a :href="'https://osu.ppy.sh/users/' + note.author.osuId" target="_blank">
                        {{ note.author.username }}
                    </a>
                </b>
                <a
                    href="#"
                    class="ml-1 text-danger"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="delete note"
                    @click.prevent="hideNote(note.id);"
                >
                    &times;
                </a>
                <a
                    v-if="note.author.id == userId"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="edit note"
                    @click.prevent="editNoteId == note.id ? editNoteId = '' : editNoteId = note.id, editNoteComment = note.comment"
                >
                    <i class="fas fa-edit" />
                </a>

                <div v-if="note.id != editNoteId" class="text-secondary pre-line ml-2" v-html="filterLinks(note.comment)" />
                <div v-else>
                    <div class="input-group">
                        <textarea
                            v-model="editNoteComment"
                            placeholder="edit user note..."
                            class="form-control"
                            rows="2"
                        />
                        <div class="input-group-append">
                            <button class="btn btn-nat" @click="editNote($event)">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Notes',
    mixins: [postData, filterLinks],
    data() {
        return {
            notes: null,
            comment: '',
            editNoteId: '',
            editNoteComment: '',
        };
    },
    computed: {
        ...mapState([
            'userId',
        ]),
        ...mapGetters([
            'selectedUser',
        ]),
    },
    watch: {
        selectedUser() {
            this.notes = null;
            this.comment = '';
            this.editNoteId = '';
            this.loadUserNotes();
        },
    },
    mounted() {
        this.loadUserNotes();
    },
    methods: {
        async loadUserNotes() {
            const notes = await this.executeGet('/users/loadUserNotes/' + this.selectedUser.id);

            if (notes) {
                this.notes = notes;
            }
        },
        async saveNote(e) {
            if (this.comment.length) {
                const note = await this.executePost('/users/saveNote/' + this.selectedUser.id, { comment: this.comment }, e);

                if (note && !note.error) {
                    if (this.notes) {
                        this.notes.unshift(note);
                        this.$store.dispatch('updateToastMessages', {
                            message: `Added note`,
                            type: 'success',
                        });
                    }
                }
            }
        },
        async editNote(e) {
            if (this.editNoteComment.length) {
                const note = await this.executePost('/users/editNote/' + this.editNoteId, { comment: this.editNoteComment }, e);

                if (note && !note.error) {
                    if (this.notes) {
                        const i = this.notes.findIndex(n => n.id == this.editNoteId);
                        this.notes[i] = note;
                        this.editNoteId = '';
                        this.$store.dispatch('updateToastMessages', {
                            message: `Edited note`,
                            type: 'success',
                        });
                    }
                }
            }
        },
        async hideNote(noteId) {
            const result = confirm(`Are you sure?`);

            if (result) {
                await this.executePost('/users/hideNote/' + noteId, { userId: this.selectedUser.id });

                if (this.notes) {
                    const i = this.notes.findIndex(note => note.id == noteId);
                    this.notes.splice(i, 1);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Removed note`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>