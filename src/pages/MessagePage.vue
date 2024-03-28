<template>
    <div v-cloak>
        <evaluation-results
            v-if="evaluation"
            :evaluation="evaluation"
            :is-new-evaluation-format="isNewEvaluationFormat"
            :nat-user-list="natUserList"
        />
        <report-feedback
            v-else-if="report"
            :report="report"
        />
        <veto-message
            v-else-if="veto"
            :veto="veto"
        />
    </div>
</template>

<script>
import EvaluationResults from '../components/evaluations/EvaluationResults.vue';
import ReportFeedback from '../components/reports/ReportFeedback.vue';
import VetoMessage from '../components/vetoes/VetoMessage.vue';

export default {
    name: 'MessagePage',
    components: {
        EvaluationResults,
        ReportFeedback,
        VetoMessage,
    },
    data() {
        return {
            evaluation: null,
            isNewEvaluationFormat: null,
            natUserList: [],
            report: null,
            veto: null,
        };
    },
    async created() {
        const evalId = this.$route.query.eval;
        const reportId = this.$route.query.report;
        const vetoId = this.$route.query.veto;

        if (evalId) {
            const result = await this.$http.initialRequest('/message/evaluation/' + evalId);

            if (result && !result.error) {
                this.evaluation = result.evaluation;
                this.isNewEvaluationFormat = result.isNewEvaluationFormat;
                this.natUserList = result.natUserList;
            }
        } else if (reportId) {
            const report = await this.$http.initialRequest('/message/report/' + reportId);

            if (report && !report.error) {
                this.report = report;
            }
        } else if (vetoId) {
            const veto = await this.$http.initialRequest('/message/veto/' + vetoId);

            if (veto && !veto.error) {
                this.veto = veto;
            }
        }

        if (!this.evaluation && !this.report && !this.veto) {
            this.$router.push(`home`);
        }
    },
};
</script>
