<template>
    <div v-cloak>
        <evaluation-results
            v-if="evaluation"
            :evaluation="evaluation"
        />
        <report-feedback
            v-else-if="report"
            :report="report"
        />
    </div>
</template>

<script>
import EvaluationResults from '../components/evaluations/EvaluationResults.vue';
import ReportFeedback from '../components/reports/ReportFeedback.vue';

export default {
    name: 'MessagePage',
    components: {
        EvaluationResults,
        ReportFeedback,
    },
    data() {
        return {
            evaluation: null,
            report: null,
        };
    },
    async created() {
        const evalId = this.$route.query.eval;
        const reportId = this.$route.query.report;

        if (evalId) {
            const evaluation = await this.$http.initialRequest('/message/evaluation/' + evalId);

            if (evaluation && !evaluation.error) {
                this.evaluation = evaluation;
            }
        } else if (reportId) {
            const report = await this.$http.initialRequest('/message/report/' + reportId);

            if (report && !report.error) {
                this.report = report;
            }
        }

        if (!this.evaluation && !this.report) {
            this.$router.push(`home`);
        }
    },
};
</script>
