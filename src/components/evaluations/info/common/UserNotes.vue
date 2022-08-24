<template>
    <div>
        <p>
            <b>NAT user notes:</b>
        </p>



        <ul class="text-secondary small">
            <li v-if="summaryNote">
                <b>USER SUMMARY</b>
                <div v-html="$md.render(summaryNote.comment)" />
            </li>

            <li v-if="warningNote">
                <b>LATEST WARNING/ACTION - 
                    {{ warningNote.updatedAt | toStandardDate }} -
                    <user-link
                        :osu-id="warningNote.author.osuId"
                        :username="warningNote.author.username"
                    />
                </b>
                <div v-html="$md.render(warningNote.comment)" />
            </li>

            <li v-if="!otherNotes">
                ...
            </li>

            <li v-else-if="!otherNotes.length">
                User has no notes
            </li>

            <li
                v-for="note in otherNotes"
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
    computed: {
        /** @returns {Array} */
        otherNotes() {
            if (this.userNotes) {
                return this.userNotes.filter(n => !n.isWarning && !n.isSummary);
            }

            return [];
        },
        /** @returns {Object} */
        warningNote() {
            if (this.userNotes) {
                return this.userNotes.find(n => n.isWarning);
            }

            return null;
        },
        /** @returns {Object} */
        summaryNote() {
            if (this.userNotes) {
                return this.userNotes.find(n => n.isSummary);
            }

            return null;
        },
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
