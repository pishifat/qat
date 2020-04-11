<template>
    <div>
        <events-list
            :events="nominations"
            :events-id="'uniqueNominations' + mode"
            :header="'Unique nominations'"
            :loading="loading"
            :is-nat="isNat"
            @update-editing="editing = !editing"
        />
        <nomination-resets
            :events="nominationsDisqualified"
            :events-id="'nominationsDisqualified' + mode"
            :header="'Nominations disqualified'"
            :loading="loading"
            :is-nat="isNat"
            @update-content="updateContent($event)"
            @update-obviousness="updateObviousness($event)"
            @update-severity="updateSeverity($event)"
        />
        <nomination-resets
            :events="nominationsPopped"
            :events-id="'nominationsPopped' + mode"
            :header="'Nominations popped'"
            :loading="loading"
            :is-nat="isNat"
            @update-content="updateContent($event)"
            @update-obviousness="updateObviousness($event)"
            @update-severity="updateSeverity($event)"
        />
        <nomination-resets
            :events="disqualifications"
            :events-id="'disqualificationsByUser' + mode"
            :header="'Disqualifications done by user'"
            :loading="loading"
            :is-nat="isNat"
            @update-content="updateContent($event)"
            @update-obviousness="updateObviousness($event)"
            @update-severity="updateSeverity($event)"
        />
        <nomination-resets
            :events="pops"
            :events-id="'popsByUser' + mode"
            :header="'Pops done by user'"
            :loading="loading"
            :is-nat="isNat"
            @update-content="updateContent($event)"
            @update-obviousness="updateObviousness($event)"
            @update-severity="updateSeverity($event)"
        />
        <events-list
            :events="qualityAssuranceChecks"
            :events-id="'qualityAssuranceChecks' + mode"
            :header="'Quality Assurance Checks'"
            :loading="loading"
            :is-nat="isNat"
        />
        <evaluation-list
            v-if="isNat && assignedApplications && assignedApplications.length"
            :events="assignedApplications"
            :events-id="'assignedApplications' + mode"
            :header="'Application Evaluations (BN)'"
            :loading="loading"
            :is-application="true"
            :user-id="userMongoId"
        />
        <evaluation-list
            v-if="isNat && natApplications && natApplications.length"
            :events="natApplications"
            :events-id="'natApplications' + mode"
            :header="'Application Evaluations (NAT)'"
            :loading="loading"
            :is-application="true"
            :user-id="userMongoId"
        />
        <evaluation-list
            v-if="isNat && natEvalRounds && natEvalRounds.length"
            :events="natEvalRounds"
            :events-id="'natEvalRounds' + mode"
            :header="'Current BN Evaluations (NAT)'"
            :loading="loading"
            :is-application="false"
            :user-id="userMongoId"
        />
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import EventsList from './EventsList.vue';
import NominationResets from './NominationResets.vue';
import EvaluationList from './EvaluationList.vue';
import Vue from 'vue';

export default {
    name: 'UserActivity',
    components: {
        EventsList,
        NominationResets,
        EvaluationList,
    },
    mixins: [ postData, filterLinks ],
    props: {
        osuId: Number,
        mode: String,
        deadline: String,
        isNat: Boolean,
        userMongoId: String,
    },
    data() {
        return {
            nominations: null,
            pops: null,
            disqualifications: null,
            nominationsPopped: null,
            nominationsDisqualified: null,
            qualityAssuranceChecks: null,
            assignedApplications: null,
            natApplications: null,
            natEvalRounds: null,
            loading: true,
        };
    },
    watch: {
        osuId() {
            this.loading = true;
            this.findRelevantActivity();
        },
    },
    created () {
        this.findRelevantActivity();
    },
    methods: {
        async findRelevantActivity() {
            const res = await axios.get('/bnEval/userActivity/' + this.osuId + '/' + this.mode + '/' + new Date(this.deadline).getTime() + '/' + this.userMongoId);

            if (res.data) {
                this.nominations = res.data.noms;
                this.nominationsDisqualified = res.data.nomsDqd;
                this.nominationsPopped = res.data.nomsPopped;
                this.disqualifications = res.data.dqs;
                this.pops = res.data.pops;
                this.qualityAssuranceChecks = res.data.qualityAssuranceChecks;
                this.assignedApplications = res.data.assignedApplications;
                this.natApplications = res.data.natApplications;
                this.natEvalRounds = res.data.natEvalRounds;
                this.loading = false;
            }
        },
        updateContent (event) {
            let i;

            if (event.type == 'Disqualified') {
                i = this.disqualifications.findIndex(e => e._id == event.id);
                if (i >= 0) this.disqualifications[i].content = event.value;

                i = this.nominationsDisqualified.findIndex(e => e._id == event.id);
                if (i >= 0) this.nominationsDisqualified[i].content = event.value;

            } else if (event.type == 'Popped') {
                i = this.pops.findIndex(e => e._id == event.id);
                if (i >= 0) this.pops[i].content = event.value;

                i = this.nominationsPopped.findIndex(e => e._id == event.id);
                if (i >= 0) this.nominationsPopped[i].content = event.value;
            }
        },
        updateObviousness (event) {
            let i;

            if (event.type == 'Disqualified') {
                i = this.disqualifications.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.disqualifications[i], 'obviousness', event.value);

                i = this.nominationsDisqualified.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.nominationsDisqualified[i], 'obviousness', event.value);

            } else if (event.type == 'Popped') {
                i = this.pops.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.pops[i], 'obviousness', event.value);

                i = this.nominationsPopped.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.nominationsPopped[i], 'obviousness', event.value);
            }
        },
        updateSeverity (event) {
            let i;

            if (event.type == 'Disqualified') {
                i = this.disqualifications.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.disqualifications[i], 'severity', event.value);

                i = this.nominationsDisqualified.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.nominationsDisqualified[i], 'severity', event.value);

            } else if (event.type == 'Popped') {
                i = this.pops.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.pops[i], 'severity', event.value);

                i = this.nominationsPopped.findIndex(e => e._id == event.id);
                if (i >= 0) Vue.set(this.nominationsPopped[i], 'severity', event.value);
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