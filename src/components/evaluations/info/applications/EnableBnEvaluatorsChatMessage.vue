<template>
    <div>
        <bot-chat-message
            :messages="messages"
            :message-type="'enableBnEvaluators'"
            :mongo-id="selectedEvaluation.id"
            :users="users"
            :custom-text="'Send messages & enable BN evaluators'"
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
        /** @returns {Array} */
        messages () {
            let messages = [];

            messages.push(`hello! you've been selected to help evaluate the ${this.selectedEvaluation.mode == 'osu' ? 'osu!' : 'osu!' + this.selectedEvaluation.mode} mode BN app for ${this.selectedEvaluation.user.username} - https://osu.ppy.sh/users/${this.selectedEvaluation.user.osuId}`);
            messages.push(`please post your thoughts on their behavior and modding (based on the submitted mods and anything else you know) on the BN/NAT website - https://bn.mappersguild.com/appeval -- your input is anonymous to everyone but the NAT!`);
            messages.push(`if you can't see ${this.selectedEvaluation.user.username}'s eval, it already reached a consensus (this usually happens ~1 week after receiving this message!)`);
            messages.push(`evaluating users is an optional thing. if you'd like to opt out, visit your card on the users page of the BN website - https://bn.mappersguild.com/users`);
            messages.push(`thank you!!!! —NAT`);

            return messages;
        },
    },
};
</script>
