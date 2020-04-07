<template>
    <div>
        <div class="d-flex">
            <textarea
                v-model="comment"
                placeholder="new user note..."
                class="form-control dark-textarea mr-2"
                style="white-space: pre-line;"
                rows="2"
            />
            <button class="btn btn-sm btn-nat align-self-center" @click="saveNote($event)">
                Save
            </button>
        </div>

        <ul class="mt-2">
            <li v-if="!notes" class="small min-spacing text-shadow">
                ...
            </li>
            <li v-else-if="!notes.length" class="small min-spacing text-shadow">
                User has no notes
            </li>
            <li
                v-for="note in notes"
                v-else
                :key="note.id"
                class="small text-shadow"
            >
                <b>
                    {{ note.updatedAt.slice(0,10) }} -
                    <a :href="'https://osu.ppy.sh/users/' + note.author.osuId" target="_blank">
                        {{ note.author.username }}
                    </a>
                </b>
                <a
                    href="#"
                    class="vote-fail"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="delete note"
                    @click.prevent="hideNote(note.id);"
                >&times;</a>
                <a
                    v-if="note.author.id == viewingUser"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="edit note"
                    @click.prevent="editNoteId == note.id ? editNoteId = '' : editNoteId = note.id, editNoteComment = note.comment"
                ><i class="fas fa-edit" /></a>
                <pre v-if="note.id != editNoteId" class="secondary-text pre-font ml-2" v-html="filterLinks(note.comment)" />
                <div v-else class="d-flex">
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
                </div>
            </li>
        </ul>
        <p v-if="info.length" class="errors text-shadow mt-2">
            {{ info }}
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Notes',
    mixins: [postData, filterLinks],
    props: {
        userId: String,
        viewingUser: String,

    },
    data() {
        return {
            notes: null,
            comment: '',
            info: '',
            editNoteId: '',
            editNoteComment: '',
        };
    },
    watch: {
        userId() {
            this.notes = null;
            this.comment = '';
            this.info = '';
            this.editNoteId = '';
            this.loadUserNotes();
        },
    },
    mounted() {
        this.loadUserNotes();
    },
    methods: {
        async loadUserNotes() {
            axios
                .get('/users/loadUserNotes/' + this.userId)
                .then(response => {
                    this.notes = response.data;
                });
        },
        async saveNote(e) {
            if (this.comment.length) {
                const n = await this.executePost('/users/saveNote/' + this.userId, { comment: this.comment }, e);

                if (n) {
                    if (n.error) {
                        this.info = n.error;
                    } else {
                        if (this.notes) {
                            this.notes.unshift(n);
                        }
                    }
                }
            }
        },
        async editNote(e) {
            if (this.editNoteComment.length) {
                const n = await this.executePost('/users/editNote/' + this.editNoteId, { comment: this.editNoteComment }, e);

                if (n) {
                    if (n.error) {
                        this.info = n.error;
                    } else {
                        if (this.notes) {
                            const i = this.notes.findIndex(note => note.id == this.editNoteId);
                            this.notes[i] = n;
                            this.editNoteId = '';
                        }
                    }
                }
            }
        },
        async hideNote(noteId) {
            const result = confirm(`Are you sure?`);

            if (result) {
                await this.executePost('/users/hideNote/' + noteId, { userId: this.userId });

                if (this.notes) {
                    const i = this.notes.findIndex(note => note.id == noteId);
                    this.notes.splice(i, 1);
                }
            }
        },
    },
};
</script>