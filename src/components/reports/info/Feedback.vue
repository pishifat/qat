<template>
    <div>
        <div v-if="selectedReport.isActive">
            <p class="text-shadow min-spacing mb-1">
                Feedback:
            </p>

            <p class="small text-shadow ml-2">
                This will be sent to the reporter in a forum PM. Include the consensus and any actions being taken.
            </p>

            <div class="form-group mt-2">
                <textarea
                    id="feedback"
                    v-model="feedback"
                    class="form-control dark-textarea"
                    style="white-space: pre-line;"
                    rows="4"
                />
            </div>

            <div class="d-flex justify-content-end mb-2">
                <div class="form-check form-check-inline">
                    <input
                        id="1"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="1"
                    >
                    <label class="form-check-label text-shadow vote-pass" for="1">Valid</label>
                </div>
                <div class="form-check form-check-inline">
                    <input
                        id="2"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="2"
                    >
                    <label class="form-check-label text-shadow vote-neutral" for="2">Partially valid</label>
                </div>
                <div class="form-check form-check-inline">
                    <input
                        id="3"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="3"
                    >
                    <label class="form-check-label text-shadow vote-fail" for="3">Invalid</label>
                </div>
            </div>
            <div class="d-flex justify-content-end mb-3">
                <button
                    class="btn btn-sm btn-nat mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Generates feedback PM and stores feedback/validity inputs"
                    @click="submitReportEval($event);"
                >
                    Save Report Evaluation
                </button>
                <button
                    class="btn btn-sm btn-nat-red mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Disables feedback/validity inputs and reveals reporter"
                    @click="submitReportEval($event, true)"
                >
                    Close Report
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'Feedback',
    mixins: [postData],
    data() {
        return {
            feedback: '',
            vote: null,
        };
    },
    computed: {
        ...mapGetters([
            'selectedReport',
        ]),
    },
    watch: {
        selectedReport() {
            this.findRelevantReportInfo();
        },
    },
    created() {
        this.findRelevantReportInfo();
    },
    methods: {
        findRelevantReportInfo() {
            this.feedback = this.selectedReport.feedback;
            this.vote = this.selectedReport.valid;
        },
        async submitReportEval (e, close) {
            if (close && (!this.vote || (!this.feedback || !this.feedback.length))) {
                this.$store.dispatch('updateToastMessages', {
                    message: `cannot leave fields blank!`,
                    type: 'danger',
                });
            } else if (!this.vote && (!this.feedback || !this.feedback.length)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `at least one field must have input!`,
                    type: 'danger',
                });
            } else {
                let report;

                if (close) {
                    const result = confirm(`Are you sure? Report feedback cannot be edited after closing. Doing this will reveal the reporter.`);

                    if (result) {
                        report = await this.executePost(
                            '/manageReports/submitReportEval/' + this.selectedReport.id,
                            { vote: this.vote, feedback: this.feedback, close }, e);
                    }
                } else {
                    report = await this.executePost(
                        '/manageReports/submitReportEval/' + this.selectedReport.id,
                        { vote: this.vote, feedback: this.feedback, close }, e);
                }

                if (report && !report.error) {
                    this.$store.dispatch('updateReport', report);
                    this.$store.dispatch('updateToastMessages', {
                        message: `saved evaluation`,
                        type: 'info',
                    });
                }
            }
        },
    },
};
</script>