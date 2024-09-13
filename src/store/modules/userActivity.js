import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        nominations: [],
        nominationsDisqualified: [],
        nominationsPopped: [],
        pops: [],
        disqualifications: [],
        qualityAssuranceChecks: [],
        disqualifiedQualityAssuranceChecks: [],
        assignedBnApplications: [],
        natApplications: [],
        natBnEvaluations: [],
        month1Nominations: [],
        month2Nominations: [],
        month3Nominations: [],
        currentMonthNominations: [],
        isLoading: true,
        selectedUser: null,
    }),
    mutations: {
        setIsLoading (state, value) {
            state.isLoading = value;
        },
        setNominations (state, events) {
            state.nominations = events;
        },
        setNominationsDisqualified (state, events) {
            state.nominationsDisqualified = events;
        },
        setNominationsPopped (state, events) {
            state.nominationsPopped = events;
        },
        setDisqualifications (state, events) {
            state.disqualifications = events;
        },
        setPops (state, events) {
            state.pops = events;
        },
        setQualityAssuranceChecks (state, events) {
            state.qualityAssuranceChecks = events;
        },
        setDisqualifiedQualityAssuranceChecks (state, events) {
            state.disqualifiedQualityAssuranceChecks = events;
        },
        setBnApplications (state, applications) {
            state.assignedBnApplications = applications;
        },
        setNatApplications (state, applications) {
            state.natApplications = applications;
        },
        setNatBnEvaluations (state, evaluations) {
            state.natBnEvaluations = evaluations;
        },
        setMonth1Nominations (state, month1Nominations) {
            state.month1Nominations = month1Nominations;
        },
        setMonth2Nominations (state, month2Nominations) {
            state.month2Nominations = month2Nominations;
        },
        setMonth3Nominations (state, month3Nominations) {
            state.month3Nominations = month3Nominations;
        },
        setCurrentMonthNominations (state, currentMonthNominations) {
            state.currentMonthNominations = currentMonthNominations;
        },
        setSelectedUser (state, user) {
            state.selectedUser = user;
        },
        updateEvent (state, event) {
            let i;

            if (event.type == 'disqualify') {
                i = state.disqualifications.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.disqualifications[i], event.modifiedField, event.value);

                i = state.nominationsDisqualified.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.nominationsDisqualified[i], event.modifiedField, event.value);

                i = state.disqualifiedQualityAssuranceChecks.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.disqualifiedQualityAssuranceChecks[i], event.modifiedField, event.value);
            } else if (event.type == 'nomination_reset') {
                i = state.pops.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.pops[i], event.modifiedField, event.value);

                i = state.nominationsPopped.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.nominationsPopped[i], event.modifiedField, event.value);
            }
        },
    },
};
