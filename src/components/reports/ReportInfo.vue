<template>
    <div id="reportInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="report" class="modal-content">
                <div class="modal-header text-dark bg-nat-logo">
                    <h5 class="modal-title">
                        <a v-if="report.culprit" class="text-dark" :href="'https://osu.ppy.sh/users/' + report.culprit.osuId" target="_blank">{{ report.culprit.username }}</a>
                        <span v-else class="text-dark">Report details</span>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <p class="text-shadow">
                        Reason: <pre class="small pre-font ml-4" v-html="filterLinks(report.reason)" />
                    </p>
                    <p v-if="report.link" class="text-shadow">
                        Relevant link: <span v-html="filterLinks(report.link)" />
                    </p>
                    <p class="text-shadow">
                        Reported: {{ report.createdAt.slice(0,10) }}
                    </p>
                    <p v-if="!report.isActive" class="text-shadow">
                        Reported by: <a :href="'https://osu.ppy.sh/users/' + report.reporter.osuId" target="_blank">{{ report.reporter.username }}</a>
                    </p>
                    <hr>

                    <p class="text-shadow min-spacing mb-1">
                        Feedback:
                    </p>
                    <span v-if="report.isActive">
                        <small class="text-shadow ml-2">This will be sent to the reporter in a forum PM. Include the consensus and any actions being taken.</small>
                    
                        <div class="form-group mt-2">
                            <textarea
                                id="feedback"
                                v-model="feedback"
                                class="form-control dark-textarea"
                                style="white-space: pre-line;"
                                rows="4"
                            />
                        </div>
                    </span>

                    <div id="forumMessage" class="copy-paste">
                        <samp class="small">Hello!</samp><br><br>
                        <samp v-if="report.culprit" class="small">You recently reported [url=https://osu.ppy.sh/users/{{ report.culprit.osuId }}]{{ report.culprit.username }}[/url] for the following reason:</samp>
                        <samp v-else class="small">You recently reported [url={{ report.link }}]this link[/url] for the following reason:</samp><br><br>
                        <samp class="small">[notice]{{ report.reason }}[/notice]</samp><br><br>
                        <samp class="small">After investigating this, we've decided that the report is [b]{{ report.valid == 1 ? 'valid' : report.valid == 2 ? 'partially valid' : 'invalid' }}[/b].</samp><br><br>
                        <samp class="small">Additional feedback from the NAT:</samp><br><br>
                        <samp><pre class="small">[notice]{{ report.feedback }}[/notice]</pre></samp>
                        <samp class="small">Regards, the Nomination Assessment Team</samp><br><br>
                    </div>

                    <span v-if="report.isActive">
                        <span class="mr-3 text-shadow">Validity:</span>
                        <div class="form-check form-check-inline">
                            <input
                                id="1"
                                class="form-check-input"
                                type="radio"
                                name="vote"
                                value="1"
                                :checked="report.valid == 1"
                            >
                            <label class="form-check-label text-shadow vote-pass" for="1">Valid</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input
                                id="2"
                                class="form-check-input"
                                type="radio"
                                name="vote"
                                value="2"
                                :checked="report.valid == 2"
                            >
                            <label class="form-check-label text-shadow vote-extend" for="2">Partially valid</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input
                                id="3"
                                class="form-check-input"
                                type="radio"
                                name="vote"
                                value="3"
                                :checked="report.valid == 3"
                            >
                            <label class="form-check-label text-shadow vote-fail" for="3">Invalid</label>
                        </div>
                    </span>

                    <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                        {{ info }} {{ confirm }}
                    </div>
                </div>
                <div class="modal-footer" style="overflow: hidden;">
                    <span v-if="report.isActive">
                        <button
                            class="btn btn-sm btn-nat"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Generates feedback PM and stores feedback/validity inputs"
                            @click="submitReportEval($event);"
                        >Save Report Evaluation</button>
                        <button
                            class="btn btn-sm btn-nat-red"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Disables feedback/validity inputs and reveals reporter"
                            @click="submitReportEval($event, true)"
                        >Close Report</button>
                    </span>
                    <span v-else-if="report.valid != 3">
                        <button
                            class="btn btn-sm btn-nat"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Avoid displaying repeat reports on evaluations"
                            @click="changeEvalDisplay($event);"
                        >{{ report.display ? "Hide report on evaluations" : "Show report on evaluations" }}</button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';

export default {
    name: 'ReportInfo',
    mixins: [postData, filterLinks],
    props: [ 'report', 'isLeader', 'isSpectator' ],
    data() {
        return {
            feedback: '',
            confirm: '',
            info: '',
        };
    },
    watch: {
        report(v) {
            if(v){
                this.info = '';
                this.confirm = '';
                this.feedback = this.report.feedback;
                history.pushState(null, 'Manage Reports', `/managereports?report=${this.report.id}`);
            }
        },
    },
    methods: {
        async submitReportEval (e, close) {
            const valid = $('input[name=vote]:checked').val();
            if(close && (!valid || (!this.feedback || !this.feedback.length))){
                this.info = 'Cannot leave fields blank!';
            }else if(!valid && (!this.feedback || !this.feedback.length)){
                this.info = 'At least one field must have input!';
            }else if(this.isSpectator){
                this.info = 'You\'re not allowed to do that';
            }else{
                let r;
                if(close){
                    const result = confirm(`Are you sure? Report feedback cannot be edited after closing. Doing this will reveal the reporter.`);
                    if(result){
                        r = await this.executePost(
                            '/manageReports/submitReportEval/' + this.report.id, 
                            { valid, feedback: this.feedback, close }, e);
                    }
                }else{
                    r = await this.executePost(
                        '/manageReports/submitReportEval/' + this.report.id, 
                        { valid, feedback: this.feedback, close }, e);
                }
                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        await this.$emit('update-report', r);
                        this.confirm = 'Report updated!';
                    }
                }
            }
        },
        async changeEvalDisplay (e) {
            let r = await this.executePost('/manageReports/changeEvalDisplay/' + this.report.id, { display: this.report.display }, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    await this.$emit('update-report', r);
                    this.confirm = 'Report updated!';
                }
            }
        },
    },
};
</script>