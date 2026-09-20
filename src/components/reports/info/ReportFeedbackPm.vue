<template>
    <div>
        <div v-if="selectedReport.isAiBeatmap" class="alert alert-primary mb-0">
            <i class="fas fa-comment-slash me-1" />
            Can't send messages for AI reports
        </div>

        <div v-else-if="selectedReport.isMessageSent" class="alert alert-primary mb-0">
            <p class="mb-1">
                <i class="fas fa-check me-1" />
                Message sent
            </p>
            <p class="mb-0 small">
                <b>Response:</b>
                <a :href="responseLink" target="_blank" class="alert-link">
                    https://bn.mappersguild.com{{ responseLink }}
                </a>
            </p>
        </div>

        <bot-chat-message
            v-else
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
        responseLink () {
            return '/message?report=' + this.selectedReport.id;
        },
        /** @returns {string} */
        message () {
            let message = `hello! you recently reported a concern about ${this.selectedReport.culprit ? `[${this.selectedReport.culprit.username}](https://osu.ppy.sh/users/${this.selectedReport.culprit.osuId})` : this.selectedReport.link} to the NAT`;
            message += `\n\n`;
            message += `the NAT reviewed your report${this.selectedReport.isContentCase ? 'ed content ' : ''} and believe it is **${this.selectedReport.valid === 1 && this.selectedReport.isContentCase ? 'valid for use' : this.selectedReport.valid === 1 ? 'valid' : this.selectedReport.valid === 2 ? 'partially valid' : this.selectedReport.valid === 3 && this.selectedReport.isContentCase ? 'invalid for use' : 'invalid'}**`;
            message += `\n\n`;
            message += `view your full report and feedback here: https://bn.mappersguild.com${this.responseLink}`;
            message += `\n\n`;
            message += `thank you!`;
            message += `\n\n`;
            message += `—NAT`;

            return message;
        },
    },
};
</script>
