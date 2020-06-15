<template>
    <div>
        <p>
            <b>NAT user notes:</b>
        </p>

        <ul class="text-secondary small">
            <li v-if="!userNotes">
                ...
            </li>
            <li v-else-if="!userNotes.length">
                User has no notes
            </li>
            <li
                v-for="note in userNotes"
                v-else
                :key="note.id"
            >
                <b>
                    {{ note.updatedAt.slice(0,10) }} -
                    <a :href="'https://osu.ppy.sh/users/' + note.author.osuId" target="_blank">
                        {{ note.author.username }}
                    </a>
                </b>
                <div v-html="$md.render(note.comment)" />
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';

export default {
    name: 'UserNotes',
    mixins: [ postData ],
    props: {
        userMongoId: {
            type: String,
            required: true,
        },
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
            const res = await this.executeGet('/bnEval/findUserNotes/' + this.userMongoId);

            if (res) {
                this.userNotes = res.userNotes;
            }
        },
    },
};
</script>
