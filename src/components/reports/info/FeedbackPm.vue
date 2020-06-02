<template>
    <div>
        <button class="btn btn-sm btn-block btn-primary mb-2" data-toggle="collapse" data-target="#forumMessage">
            See full forum PM <i class="fas fa-angle-down" />
        </button>

        <div id="forumMessage" class="collapse">
            <a :href="'https://osu.ppy.sh/forum/ucp.php?i=pm&mode=compose&u=' + selectedReport.reporter.osuId" target="_blank" class="btn btn-sm btn-block btn-primary mb-2">
                Open osu! PM
            </a>

            <div class="card card-body pre-line small">
                <span>Hello!</span><br><br>
                <span v-if="selectedReport.culprit">You recently reported [url=https://osu.ppy.sh/users/{{ selectedReport.culprit.osuId }}]{{ selectedReport.culprit.username }}[/url] for the following reason:</span>
                <span v-else>You recently reported [url={{ selectedReport.link }}]this link[/url] for the following reason:</span><br><br>
                <span>[notice]{{ selectedReport.reason }}[/notice]</span>
                <span>After investigating this, we've decided that the report is [b]{{ selectedReport.valid == 1 ? 'valid' : selectedReport.valid == 2 ? 'partially valid' : 'invalid' }}[/b].</span><br><br>
                <span>Additional feedback from the NAT:</span><br><br>
                <span>[notice]{{ selectedReport.feedback }}[/notice]</span>
                <span>Regards, the Nomination Assessment Team</span><br>
            </div>
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