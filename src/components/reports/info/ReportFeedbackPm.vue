<template>
    <div>
        <bot-chat-message
            :message="message"
            :message-type="'report'"
            :mongo-id="selectedReport.id"
            :users="[{ username: selectedReport.reporter.username, osuId: selectedReport.reporter.osuId }]"
            :custom-text="'Send message'"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BotChatMessage from '../../BotChatMessage.vue';

export default {
    name: 'ReportFeedbackPm',
    components: {
        BotChatMessage,
    },
    computed: {
        ...mapGetters('manageReports', [
            'selectedReport',
        ]),
        /** @returns {string} */
        message () {
            let message = `hello! you recently reported a concern about ${this.selectedReport.culprit ? `[${this.selectedReport.culprit.username}](https://osu.ppy.sh/users/${this.selectedReport.culprit.osuId})` : this.selectedReport.link} to the NAT`;
            message += `\n\n`;
            message += `the NAT reviewed your report${this.selectedReport.isContentCase ? 'ed content ' : ''} and believe it is **${this.selectedReport.valid === 1 && this.selectedReport.isContentCase ? 'valid for use' : this.selectedReport.valid === 1 ? 'valid' : this.selectedReport.valid === 2 ? 'partially valid' : this.selectedReport.valid === 3 && this.selectedReport.isContentCase ? 'invalid for use' : 'invalid'}**`;
            message += `\n\n`;
            message += `view your full report and feedback here: https://bn.mappersguild.com/message?report=${this.selectedReport.id}`;
            message += `\n\n`;
            message += `thank you!`;
            message += `\n\n`;
            message += `—NAT`;

            return message;
        },
    },
};
</script>
