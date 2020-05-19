import Vue from 'vue';

const userActivityModule = {
    namespace: false,
    state: {
        nominations: null,
        nominationsDisqualified: null,
        nominationsPopped: null,
        pops: null,
        disqualifications: null,
        qualityAssuranceChecks: null,
        disqualifiedQualityAssuranceChecks: null,
        assignedApplications: null,
        natApplications: null,
        natEvalRounds: null,
        isLoading: true,
    },
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
        setAssignedApplications (state, applications) {
            state.assignedApplications = applications;
        },
        setNatApplications (state, applications) {
            state.natApplications = applications;
        },
        setNatEvalRounds (state, evalRounds) {
            state.natEvalRounds = evalRounds;
        },
        updateEvent (state, event) {
            let i;

            if (event.type == 'Disqualified') {
                i = state.disqualifications.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.disqualifications[i], event.modifiedField, event.value);

                i = state.nominationsDisqualified.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.nominationsDisqualified[i], event.modifiedField, event.value);

                i = state.disqualifiedQualityAssuranceChecks.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.disqualifiedQualityAssuranceChecks[i], event.modifiedField, event.value);
            } else if (event.type == 'Popped') {
                i = state.pops.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.pops[i], event.modifiedField, event.value);

                i = state.nominationsPopped.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(state.nominationsPopped[i], event.modifiedField, event.value);
            }
        },
    },
};

export default userActivityModule;
