<template>
    <div>
        <bot-chat-message
            :message="message"
            :message-type="'enableBnEvaluators'"
            :mongo-id="selectedEvaluation.id"
            :users="users"
            :custom-text="'Send message & enable mock evaluations'"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BotChatMessage from '../../../BotChatMessage.vue';

export default {
    name: 'EnableBnEvaluatorsChatMessage',
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
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string} */
        message () {
            let message =`hello! you've been selected to help evaluate the ${this.selectedEvaluation.mode == 'osu' ? 'osu!' : 'osu!' + this.selectedEvaluation.mode} mode BN app for [${this.selectedEvaluation.user.username}](https://osu.ppy.sh/users/${this.selectedEvaluation.user.osuId})`;
            message += `\n\n`;
            message += `please post your thoughts on their behavior and modding (based on the submitted mods and anything else you know) on the [BN/NAT website](https://bn.mappersguild.com/appeval) — your input is anonymous to everyone but the NAT!`;
            message += `\n\n`;
            message += `evaluating users is an optional thing. if you'd like to opt out, visit your **settings** page on the [website](https://bn.mappersguild.com)`;
            message += `\n\n`;
            message += `thank you!!!!`;
            message += `\n\n`;
            message += `—NAT`;

            return message;
        },
    },
};
</script>
