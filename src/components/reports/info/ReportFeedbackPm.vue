<template>
    <div>
        <chat-message-container
            :osu-id="selectedReport.reporter.osuId"
            :message-type="'report'"
            :mongo-id="selectedReport.id"
        >
            {{ message }}
        </chat-message-container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatMessageContainer from '../../ChatMessageContainer.vue';

export default {
    name: 'ReportFeedbackPm',
    components: {
        ChatMessageContainer,
    },
    computed: {
        ...mapGetters('manageReports', [
            'selectedReport',
        ]),
        /** @returns {string} */
        message () {
            let message = `Hello! You recently reported ${this.selectedReport.culprit ? this.selectedReport.culprit.username : this.selectedReport.link}. The NAT reviewed your report and believe it is ${this.selectedReport.valid === 1 ? 'valid' : this.selectedReport.valid === 2 ? 'partially valid' : 'invalid'}. View your full report and feedback here: https://bn.mappersguild.com/message?report=${this.selectedReport.id} —NAT`;

            return message;
        },
    },
};
</script>
