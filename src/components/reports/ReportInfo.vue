<template>

<div id="reportInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="report">
            <div class="modal-header text-dark bg-nat-logo">
                <h5 class="modal-title">{{report.culprit.username}}</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <p class="text-shadow">Reason: <span class="small">{{report.reason}}</span></p>
                <p class="text-shadow">Reported: {{report.createdAt.slice(0,10)}}</p>
                <hr>

                <span class="text-shadow">Feedback: </span>
                <br>
                <small class="text-shadow ml-2">This will be sent to the reporter in a forum PM. Include the consensus and any actions being taken.</small>
                
                <div class="form-group mt-2">
                    <textarea class="form-control dark-textarea" id="feedback" rows="4" v-model="feedback"></textarea>
                </div>

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

                 <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">{{info}} {{confirm}}</div>

            </div>
            <div class="modal-footer" style="overflow: hidden;">
                <button class="btn btn-sm btn-nat" @click="submitReportEval($event)">{{report.valid && report.feedback ? 'Update Report Evaluation' : 'Submit Report Evaluation'}}</button>
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
    props: [ 'report' ],
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
        submitReportEval: async function (e) {
            const valid = $('input[name=vote]:checked').val();
            if(!valid && (!this.feedback || !this.feedback.length)){
                this.info = 'At least one field must have input!'
            }else{
                const r = await this.executePost(
                    '/manageReports/submitReportEval/' + this.report.id, 
                    { valid: valid, feedback: this.feedback }, e);
                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        await this.$emit('update-report', r);
                        this.confirm = 'Report updated!'
                    }
                }
            }
        }
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