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

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import messageModule from '../store/message';
import EvaluationResults from '../components/evaluations/EvaluationResults.vue';
import ReportFeedback from '../components/reports/ReportFeedback.vue';
import VetoMessage from '../components/vetoes/VetoMessage.vue';

export default {
    name: 'MessagePage',
    components: {
        ToastMessages,
        EvaluationResults,
        ReportFeedback,
        VetoMessage,
    },
    computed: {
        ...mapState('message', [
            'evaluation',
            'isNewEvaluationFormat',
            'natUserList',
            'report',
            'veto',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('message')) {
            this.$store.registerModule('message', messageModule);
        }
    },
    async created() {
        const evalId = this.$route.query.eval;
        const reportId = this.$route.query.report;
        const vetoId = this.$route.query.veto;

        if (evalId) {
            const result = await this.$http.initialRequest('/message/evaluation/' + evalId);

            if (result && !result.error) {
                this.$store.commit(`message/setEvaluationInfo`, result);
            }
        } else if (reportId) {
            const report = await this.$http.initialRequest('/message/report/' + reportId);

            if (report && !report.error) {
                this.$store.commit(`message/setReport`, report);
            }
        } else if (vetoId) {
            const veto = await this.$http.initialRequest('/message/veto/' + vetoId);

            if (veto && !veto.error) {
                this.$store.commit(`message/setVeto`, veto);
            }
        }

        if (!this.evaluation && !this.report && !this.veto) {
            this.$router.push(`home`);
        }
    },
};
</script>
