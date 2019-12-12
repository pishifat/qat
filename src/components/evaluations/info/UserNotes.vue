<template>
    <div>
        <p class="min-spacing text-shadow">
            NAT user notes:
        </p>
        <ul v-if="userNotes">
            <li v-if="!userNotes.length" class="small min-spacing text-shadow">User has no notes</li>
            <li v-else v-for="note in userNotes" :key="note.id" class="small text-shadow">
                <b>{{ note.updatedAt.slice(0,10) }} - {{ note.author.username }}</b>
                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(note.comment)"></pre>
            </li>
        </ul>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'user-notes',
    props: {
        userMongoId: String,
    },
    mixins: [ filterLinks ],
    watch: {
        userMongoId() {
            this.findUserNotes();
        },
    },
    mounted () {
        this.findUserNotes();
    },
    data() {
        return {
            userNotes: null,
        };
    },
    methods: {
        async findUserNotes() {
            this.userNotes = null;
            axios
                .get('/bnEval/findUserNotes/' + this.userMongoId)
                .then(response => {
                    this.userNotes = response.data.userNotes;
                });
        }
    }
};
</script>