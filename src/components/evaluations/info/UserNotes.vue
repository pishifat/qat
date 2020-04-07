<template>
    <div>
        <p class="min-spacing text-shadow">
            NAT user notes:
        </p>
        <ul>
            <li v-if="!userNotes" class="small min-spacing text-shadow">
                ...
            </li>
            <li v-else-if="!userNotes.length" class="small min-spacing text-shadow">
                User has no notes
            </li>
            <li
                v-for="note in userNotes"
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
                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(note.comment)" />
            </li>
        </ul>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'UserNotes',
    mixins: [ filterLinks ],
    props: {
        userMongoId: String,
    },
    data() {
        return {
            userNotes: null,
        };
    },
    watch: {
        userMongoId() {
            this.userNotes = null;
            this.findUserNotes();
        },
    },
    mounted () {
        this.findUserNotes();
    },
    methods: {
        async findUserNotes() {
            this.userNotes = null;
            axios
                .get('/bnEval/findUserNotes/' + this.userMongoId)
                .then(response => {
                    this.userNotes = response.data.userNotes;
                });
        },
    },
};
</script>