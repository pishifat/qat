<template>
    <div>
        <bot-chat-message
            :message="message"
            :message-type="'enableMockEvaluators'"
            :mongo-id="selectedEvaluation.id"
            :eval-type="selectedEvaluation.kind"
            :users="users"
            :custom-text="'Send message & enable mock evaluations'"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BotChatMessage from '../../../BotChatMessage.vue';
import evaluations from '../../../../mixins/evaluations';

export default {
    name: 'EnableMockEvaluatorsChatMessage',
    components: {
        BotChatMessage,
    },
    mixins: [ evaluations ],
    props: {
        users: {
            type: Array,
            default() {
                return [];
            },
        },
        evalType: {
            type: String,
            default: 'application',
        },
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string} */
        message () {
            const mode = this.formatMode(this.selectedEvaluation.mode);
            const evalType = this.evalType === 'application' ? 'application' : 'evaluation';
            const userLink = `[${this.selectedEvaluation.user.username}](https://osu.ppy.sh/users/${this.selectedEvaluation.user.osuId})`;
            const activityType = this.evalType === 'application' ? 'submitted mods' : 'BN activity/mods';
            const website = this.evalType === 'application' ? 'https://bn.mappersguild.com/appeval' : 'https://bn.mappersguild.com/bneval';

            let message =`hello! you've been selected to help evaluate the ${mode} mode BN ${evalType} for ${userLink}.`;
            message += `\n\n`;
            message += `please post your thoughts on their behavior and modding (based on their ${activityType} and anything else you know) on the [BN/NAT website](${website}) — your input is anonymous to everyone but the NAT!`;
            message += `\n\n`;
            message += `evaluating users is an optional thing. if you'd like to opt out, you may ignore this message and visit your **settings** page on the [website](https://bn.mappersguild.com) to disable mock evaluations.`;
            message += `\n\n`;
            message += `thank you!!!!`;
            message += `\n\n`;
            message += `—NAT`;

            return message;
        },
    },
};
</script>
