<template>
    <div>
        <bot-chat-message
            :messages="messages"
            :message-type="'veto'"
            :mongo-id="selectedVeto.id"
            :users="users"
            :custom-text="'Send messages'"
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
        /** @returns {Array} */
        messages () {
            let messages = [];

            messages.push(`hello! you've been selected to help mediate a veto for https://osu.ppy.sh/beatmapsets/${this.selectedVeto.beatmapId}`);
            messages.push(`read details here: https://bn.mappersguild.com/message?veto=${this.selectedVeto.id}`);
            messages.push(`thank you!`);
            messages.push(`—NAT`);

            return messages;
        },
    },
};
</script>
