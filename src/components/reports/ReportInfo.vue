<template>

<div id="reportInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="report">
            <div class="modal-header text-dark bg-nat-logo">
                <h5 class="modal-title"><a class="text-dark" :href="'https://osu.ppy.sh/users/' + report.culprit.osuId" target="_blank">{{report.culprit.username}}</a></h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <p class="text-shadow">Reason: <span class="small">{{report.reason}}</span></p>
                <p class="text-shadow">Reported: {{report.createdAt.slice(0,10)}}</p>
                <p v-if="!report.isActive" class="text-shadow">Reported by: <a :href="'https://osu.ppy.sh/users/' + report.reporter.osuId" target="_blank">{{report.reporter.username}}</a></p>
                <hr>

                <p class="text-shadow min-spacing mb-1">Feedback:</p>
                <span v-if="report.isActive">
                    <small class="text-shadow ml-2">This will be sent to the reporter in a forum PM. Include the consensus and any actions being taken.</small>
                    
                    <div class="form-group mt-2">
                        <textarea class="form-control dark-textarea" id="feedback" rows="4" v-model="feedback"></textarea>
                    </div>
                </span>

                <div id="forumMessage" class="copy-paste">
                    <samp class="small">Hello!</samp><br><br>
                    <samp class="small">You recently reported [url=https://osu.ppy.sh/users/{{report.culprit.osuId}}]{{report.culprit.username}}[/url] for the following reason:</samp><br><br>
                    <samp class="small">[notice]{{report.reason}}[/notice]</samp><br><br>
                    <samp class="small">After investigating this, we've decided that the report is [b]{{report.valid == 1 ? 'valid' : report.valid == 2 ? 'partially valid' : 'invalid'}}[/b].</samp><br><br>
                    <samp class="small">Additional feedback from the NAT:</samp><br><br>
                    <samp class="small">[notice]{{report.feedback}}[/notice]</samp><br><br>
                    <samp class="small">Regards, the Nominator Administration Team</samp><br><br>
                </div>

                <span v-if="report.isActive">
                    <span class="mr-3 text-shadow">Validity:</span>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="vote" id="1" value="1" :checked="report.valid == 1">
                        <label class="form-check-label text-shadow vote-pass" for="1">Valid</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="vote" id="2" value="2" :checked="report.valid == 2">
                        <label class="form-check-label text-shadow vote-extend" for="2">Partially valid</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="vote" id="3" value="3" :checked="report.valid == 3">
                        <label class="form-check-label text-shadow vote-fail" for="3">Invalid</label>
                    </div>
                </span>

                 <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">{{info}} {{confirm}}</div>

            </div>
            <div v-if="report.isActive" class="modal-footer" style="overflow: hidden;">
                <button class="btn btn-sm btn-nat" @click="submitReportEval($event);" data-toggle="tooltip" data-placement="top" title="Generates feedback PM and stores feedback/validity inputs">Save Report Evaluation</button>
                <button v-if="isLeader" class="btn btn-sm btn-nat-red" @click="submitReportEval($event, true)" data-toggle="tooltip" data-placement="top" title="Disables feedback/validity inputs and reveals reporter">Close Report</button>
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'report-info',
    mixins: [postData],
    props: [ 'report', 'is-leader' ],
    watch: {
        report: function(v) {
            if(v){
                this.info = '';
                this.confirm = '';
                this.feedback = this.report.feedback;
            }
        },
    },
    methods: {
        submitReportEval: async function (e, close) {
            const valid = $('input[name=vote]:checked').val();
            if(close && (!valid || (!this.feedback || !this.feedback.length))){
                this.info = 'Cannot leave fields blank!'
            }else if(!valid && (!this.feedback || !this.feedback.length)){
                this.info = 'At least one field must have input!'
            }else{
                let r;
                if(close){
                    const result = confirm(`Are you sure? Report feedback cannot be edited after closing. Doing this will reveal the reporter.`);
                    if(result){
                        r = await this.executePost(
                        '/manageReports/submitReportEval/' + this.report.id, 
                        { valid: valid, feedback: this.feedback, close: close }, e);
                    }
                }else{
                    r = await this.executePost(
                    '/manageReports/submitReportEval/' + this.report.id, 
                    { valid: valid, feedback: this.feedback, close: close }, e);
                }
                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        await this.$emit('update-report', r);
                        this.confirm = 'Report updated!'
                    }
                }
            }
        },
    },
    data() {
        return {
            feedback: '',
            confirm: '',
            info: '',
        };
    },
}
</script>