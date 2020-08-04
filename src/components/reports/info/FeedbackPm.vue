<template>
    <div>
        <chat-message-container
            :osu-id="selectedReport.reporter.osuId"
        >
            <span>Hello!</span><br><br>
            <span v-if="selectedReport.culprit">You recently reported [url=https://osu.ppy.sh/users/{{ selectedReport.culprit.osuId }}]{{ selectedReport.culprit.username }}[/url] for the following reason:</span>
            <span v-else>You recently reported [url={{ selectedReport.link }}]this link[/url] for the following reason:</span><br><br>
            <span>[notice] {{ selectedReport.reason }} [/notice]</span>
            <span>After investigating this, we've decided that the report is [b]{{ selectedReport.valid == 1 ? 'valid' : selectedReport.valid == 2 ? 'partially valid' : 'invalid' }}[/b].</span><br><br>
            <span>Additional feedback from the NAT:</span><br><br>
            <span>[notice] {{ selectedReport.feedback }} [/notice]</span>
            <span>Regards, the Nomination Assessment Team</span><br>
        </chat-message-container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatMessageContainer from '../../ChatMessageContainer.vue';

export default {
    name: 'FeedbackPm',
    components: {
        ChatMessageContainer,
    },
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
};
</script>
