<template>
    <div>
        <chat-message-container
            :users="users"
            :message-type="'veto'"
            :mongo-id="selectedVeto.id"
        >
            {{ message }}
        </chat-message-container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatMessageContainer from '../ChatMessageContainer.vue';

export default {
    name: 'VetoChatMessage',
    components: {
        ChatMessageContainer,
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
            let message = `You've been selected to help mediate a veto for https://osu.ppy.sh/beatmapsets/${this.selectedVeto.beatmapId} -- Read details here: https://bn.mappersguild.com/message?veto=${this.selectedVeto.id} -- Thank you! —NAT`;

            return message;
        },
    },
};
</script>
