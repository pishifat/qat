<template>
    <div>
        <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#forumMessage">
            See full forum PM <i class="fas fa-angle-down" />
        </button>
        <div id="forumMessage" class="copy-paste collapse">
            <samp class="small">Hello!</samp><br><br>
            <samp v-if="selectedReport.culprit" class="small">You recently reported [url=https://osu.ppy.sh/users/{{ selectedReport.culprit.osuId }}]{{ selectedReport.culprit.username }}[/url] for the following reason:</samp>
            <samp v-else class="small">You recently reported [url={{ selectedReport.link }}]this link[/url] for the following reason:</samp><br><br>
            <pre class="secondary-text small">[notice]{{ selectedReport.reason }}[/notice]</pre>
            <samp class="small">After investigating this, we've decided that the report is [b]{{ selectedReport.valid == 1 ? 'valid' : selectedReport.valid == 2 ? 'partially valid' : 'invalid' }}[/b].</samp><br><br>
            <samp class="small">Additional feedback from the NAT:</samp><br><br>
            <pre class="secondary-text small">[notice]{{ selectedReport.feedback }}[/notice]</pre>
            <samp class="small">Regards, the Nomination Assessment Team</samp><br><br>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'FeedbackPm',
    computed: {
        ...mapGetters([
            'selectedReport',
        ]),
    },
};
</script>