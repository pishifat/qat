<template>
    <div>
        <events-list
            :events="nominations"
            :events-id="'uniqueNominations' + mode"
            :header="'Unique nominations'"
        />
        <nomination-resets
            :events="nominationsDisqualified"
            :events-id="'nominationsDisqualified' + mode"
            :header="'Nominations disqualified'"
        />
        <nomination-resets
            :events="nominationsPopped"
            :events-id="'nominationsPopped' + mode"
            :header="'Nominations popped'"
        />
        <nomination-resets
            :events="disqualifications"
            :events-id="'disqualificationsByUser' + mode"
            :header="'Disqualifications done by user'"
        />
        <nomination-resets
            :events="pops"
            :events-id="'popsByUser' + mode"
            :header="'Pops done by user'"
        />
        <events-list
            :events="qualityAssuranceChecks"
            :events-id="'qualityAssuranceChecks' + mode"
            :header="'Quality Assurance Checks'"
        />
        <nomination-resets
            :events="disqualifiedQualityAssuranceChecks"
            :events-id="'disqualifiedQualityAssuranceChecks' + mode"
            :header="'Disqualified Quality Assurance Checks'"
        />
        <evaluation-list
            v-if="isNat && assignedApplications && assignedApplications.length"
            :events="assignedApplications"
            :events-id="'assignedApplications' + mode"
            :header="'Application Evaluations (BN)'"
            :is-application="true"
        />
        <evaluation-list
            v-if="isNat && natApplications && natApplications.length"
            :events="natApplications"
            :events-id="'natApplications' + mode"
            :header="'Application Evaluations (NAT)'"
            :is-application="true"
        />
        <evaluation-list
            v-if="isNat && natEvalRounds && natEvalRounds.length"
            :events="natEvalRounds"
            :events-id="'natEvalRounds' + mode"
            :header="'Current BN Evaluations (NAT)'"
            :is-application="false"
        />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import EventsList from './EventsList.vue';
import NominationResets from './NominationResets.vue';
import EvaluationList from './EvaluationList.vue';

export default {
    name: 'UserActivity',
    components: {
        EventsList,
        NominationResets,
        EvaluationList,
    },
    mixins: [ postData, filterLinks ],
    props: {
        mode: {
            type: String,
            required: true,
        },
        deadline: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState({
            isNat: (state) => state.isNat,
            nominations: (state) => state.userActivity.nominations,
            nominationsDisqualified: (state) => state.userActivity.nominationsDisqualified,
            nominationsPopped: (state) => state.userActivity.nominationsPopped,
            disqualifications: (state) => state.userActivity.disqualifications,
            pops: (state) => state.userActivity.pops,
            qualityAssuranceChecks: (state) => state.userActivity.qualityAssuranceChecks,
            disqualifiedQualityAssuranceChecks: (state) => state.userActivity.disqualifiedQualityAssuranceChecks,
            assignedApplications: (state) => state.userActivity.assignedApplications,
            natApplications: (state) => state.userActivity.natApplications,
            natEvalRounds: (state) => state.userActivity.natEvalRounds,
        }),
        ...mapGetters([
            'selectedUser',
        ]),
    },
    watch: {
        selectedUser() {
            this.findRelevantActivity();
        },
    },
    created () {
        this.findRelevantActivity();
    },
    methods: {
        async findRelevantActivity() {
            this.$store.commit('setIsLoading', true);

            const res = await this.executeGet('/bnEval/userActivity/' + this.selectedUser.osuId + '/' + this.mode + '/' + new Date(this.deadline).getTime() + '/' + this.selectedUser.id);

            if (res) {
                this.$store.commit('setNominations', res.noms);
                this.$store.commit('setNominationsDisqualified', res.nominationsDisqualified);
                this.$store.commit('setNominationsPopped', res.nominationsPopped);
                this.$store.commit('setDisqualifications', res.disqualifications);
                this.$store.commit('setPops', res.pops);
                this.$store.commit('setQualityAssuranceChecks', res.qualityAssuranceChecks);
                this.$store.commit('setDisqualifiedQualityAssuranceChecks', res.disqualifiedQualityAssuranceChecks);
                this.$store.commit('setAssignedApplications', res.assignedApplications);
                this.$store.commit('setNatApplications', res.natApplications);
                this.$store.commit('setNatEvalRounds', res.natEvalRounds);
                this.$store.commit('setIsLoading', false);
            }
        },
    },
};
</script>

<style>
.w-10 {
    width: 10%;
}

.w-30 {
    width: 30%;
}

.w-60 {
    width: 60%;
}
</style>