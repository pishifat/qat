export default {
    namespaced: true,
    state: () => ({
        evaluation: null,
        isNewEvaluationFormat: null,
        natUserList: [],
        report: null,
        veto: null,
    }),
    mutations: {
        setEvaluationInfo (state, result) {
            state.evaluation = result.evaluation;
            state.isNewEvaluationFormat = result.isNewEvaluationFormat;
            state.natUserList = result.natUserList;
        },
        setReport (state, report) {
            state.report = report;
        },
        setVeto (state, veto) {
            state.veto = veto;
        },
        updateEvaluationMessages (state, messages) {
            state.evaluation.messages = messages;
        },
        toggleEvaluationMessagesLocked (state) {
            state.evaluation.messagesLocked = !state.evaluation.messagesLocked;
        },
    },
};