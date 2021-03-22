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
                    {{ note.updatedAt | toStandardDate }} -
                    <user-link
                        :osu-id="note.author.osuId"
                        :username="note.author.username"
                    />
                </b>
                <div v-html="$md.render(note.comment)" />
            </li>
        </ul>
    </div>
</template>

<script>
import UserLink from '../../../UserLink.vue';

export default {
    name: 'UserNotes',
    components: {
        UserLink,
    },
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
            const res = await this.$http.executeGet('/bnEval/findUserNotes/' + this.userMongoId);

            if (res) {
                this.userNotes = res.userNotes;
            }
        },
    },
};
</script>
