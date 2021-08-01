<template>
    <div>
        <bot-chat-message
            :messages="messages"
            :message-type="'report'"
            :mongo-id="selectedReport.id"
            :users="[{ username: selectedReport.reporter.username, osuId: selectedReport.reporter.osuId }]"
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
        /** @returns {Array} */
        messages () {
            let messages = [];

            messages.push(`hello! you recently reported a concern about ${this.selectedReport.culprit ? this.selectedReport.culprit.username : this.selectedReport.link} to the NAT`);
            messages.push(`the NAT reviewed your report and believe it is ${this.selectedReport.valid === 1 ? 'valid' : this.selectedReport.valid === 2 ? 'partially valid' : 'invalid'}`);
            messages.push(`view your full report and feedback here: https://bn.mappersguild.com/message?report=${this.selectedReport.id}`);
            messages.push(`thank you!`);
            messages.push(`—NAT`);

            return messages;
        },
    },
};
</script>
