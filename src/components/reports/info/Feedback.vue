<template>
    <div>
        <div v-if="selectedReport.isActive">
            <p>
                <b>Feedback:</b>
            </p>

            <p class="small ml-2">
                This will be sent to the reporter in a forum PM. Include the consensus and any actions being taken.
            </p>

            <textarea
                id="feedback"
                v-model="feedback"
                class="form-control mb-2"
                rows="4"
            />

            <div class="form-inline justify-content-end">
                <div class="form-check form-check-inline">
                    <input
                        id="1"
                        v-model="vote"
                        class="form-check-input"
                        type="radio"
                        name="vote"
                        value="1"
                    >
                    <label class="form-check-label text-success" for="1">Valid</label>
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
                    <label class="form-check-label text-neutral" for="2">Partially valid</label>
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
                    <label class="form-check-label text-danger" for="3">Invalid</label>
                </div>
            </div>

            <div class="form-inline justify-content-end">
                <button
                    v-if="selectedReport.category && selectedReport.category.includes('contentCase')"
                    class="btn btn-sm btn-primary mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Deletes report and creates content review for relevant link"
                    @click="sendToContentReview($event);"
                >
                    Send to content review
                </button> <button
                    class="btn btn-sm btn-success mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Generates feedback PM and stores feedback/validity inputs"
                    @click="submitReportEval($event);"
                >
                    Save Report Evaluation
                </button>

                <button
                    class="btn btn-sm btn-danger mx-1"
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

export default {
    name: 'Feedback',
    data() {
        return {
            feedback: '',
            vote: null,
        };
    },
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
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
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else if (!this.vote && (!this.feedback || !this.feedback.length)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `At least one field must have input!`,
                    type: 'danger',
                });
            } else {
                if (close && !confirm(`Are you sure? Report feedback cannot be edited after closing. Doing this will reveal the reporter.`)) {
                    return;
                }

                const data = await this.$http.executePost(
                    '/manageReports/submitReportEval/' + this.selectedReport.id,
                    { vote: this.vote, feedback: this.feedback, close },
                    e
                );

                if (this.$http.isValid(data)) {
                    this.$store.dispatch('manageReports/updateReport', data.report);
                }
            }
        },
        async sendToContentReview (e) {
            const result = confirm(`Are you sure? The report will be deleted and a content review will be opened.`);

            if (result) {
                const data = await this.$http.executePost('/manageReports/sendToContentReview/' + this.selectedReport.id, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.dispatch('manageReports/updateReport', data.report);
                }
            }
        },
    },
};
</script>