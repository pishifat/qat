<template>
    <div>
        <textarea
            v-model="comment"
            placeholder="new user note..."
            class="form-control"
            rows="2"
        />

        <button class="btn btn-primary btn-block btn-sm" @click="saveNote($event)">
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
                    {{ note.updatedAt | toStandardDate }} -
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
                    v-if="note.author.id == loggedInUser.id"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="edit note"
                    @click.prevent="editNoteId == note.id ? editNoteId = '' : editNoteId = note.id, editNoteComment = note.comment"
                >
                    <i class="fas fa-edit" />
                </a>

                <div v-if="note.id != editNoteId" class="text-secondary ml-2" v-html="$md.render(note.comment)" />
                <div v-else>
                    <textarea
                        v-model="editNoteComment"
                        placeholder="edit user note..."
                        class="form-control"
                        rows="2"
                    />

                    <button class="btn btn-primary btn-sm btn-block" @click="editNote($event)">
                        Edit
                    </button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'Notes',
    mixins: [ postData ],
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
            'loggedInUser',
        ]),
        ...mapGetters('users', [
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
            const notes = await this.executeGet('/users/nat/loadUserNotes/' + this.selectedUser.id);

            if (notes) {
                this.notes = notes;
            }
        },
        async saveNote(e) {
            if (this.comment.length) {
                const note = await this.executePost('/users/nat/saveNote/' + this.selectedUser.id, { comment: this.comment }, e);

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
                const note = await this.executePost('/users/nat/editNote/' + this.editNoteId, { comment: this.editNoteComment }, e);

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
                await this.executePost('/users/nat/hideNote/' + noteId, { userId: this.selectedUser.id });

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