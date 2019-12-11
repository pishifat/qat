<template>
    <div>
        <hr>
        <div class="form-group">
            <textarea
                v-model="comment"
                placeholder="new user note..."
                class="form-control dark-textarea"
                style="white-space: pre-line;"
                rows="2"
            />
        </div>
        <div class="mb-4">
            <button class="btn btn-sm btn-nat float-right" @click="saveNote($event)">
                Save
            </button>
        </div>
        <ul class="mt-2">
            <li v-if="!notes.length" class="small min-spacing">User has no notes</li>
            <li v-else v-for="note in notes" :key="note.id" class="small text-shadow">
                <b>{{ note.createdAt.slice(0,10) }} - {{ note.author.username }}</b>
                <a href="#" @click.prevent="hideNote(note.id);" class="vote-fail" data-toggle="tooltip" data-placement="top" title="delete note">&times;</a>
                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(note.comment)"></pre>
            </li>
        </ul>
        <p v-if="info.length" class="errors text-shadow mt-2">
            {{ info }}
        </p>
        <p v-if="confirm.length" class="confirm text-shadow mt-2">
            {{ confirm }}
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'notes',
    props: {
        userId: String,
    },
    mixins: [postData, filterLinks],
    data() {
        return {
            notes: [],
            comment: '',
            info: '',
            confirm: '',
        };
    },
    watch: {
        userId() {
            this.notes = [];
            this.comment = '';
            this.info = '';
            this.confirm = '';
            this.loadUserNotes();
        }
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
            if(this.comment.length){
                const n = await this.executePost('/users/saveNote/' + this.userId, { comment: this.comment }, e);
                if (n) {
                    if (n.error) {
                        this.info = n.error;
                    } else {
                        if(this.notes){
                            this.notes.unshift(n)
                        }
                        this.confirm = 'Note added!'
                    }
                }
            }
        },
        async hideNote(noteId) {
            const result = confirm(`Are you sure?`);
            if(result){
                const n = await this.executePost('/users/hideNote/' + noteId, { userId: this.userId });
                if(this.notes){
                    const i = this.notes.findIndex(note => note.id == noteId);
                    this.notes.splice(i, 1);
                }
                this.confirm = 'Note removed!' 
            }
        },
    },
};
</script>