<template>
    <div>
        <bot-chat-message
            :message="message"
            :message-type="'veto'"
            :mongo-id="selectedVeto.id"
            :users="users"
            :custom-text="'Send message'"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BotChatMessage from '../BotChatMessage.vue';

export default {
    name: 'VetoChatMessage',
    components: {
        BotChatMessage,
    },
    props: {
        users: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        /** @returns {string} */
        message () {
            let message = `hello! you've been selected to help mediate a veto for [${this.selectedVeto.beatmapTitle}](https://osu.ppy.sh/beatmapsets/${this.selectedVeto.beatmapId}) by [${this.selectedVeto.beatmapMapper}](https://osu.ppy.sh/users/${this.selectedVeto.beatmapMapperId})`;
            message += `\n\n`;
            message += `read details here: https://bn.mappersguild.com/message?veto=${this.selectedVeto.id}`;
            message += `\n\n`;
            message += `thank you!`;
            message += `\n\n`;
            message += `—NAT`;

            return message;
        },
    },
};
</script>
