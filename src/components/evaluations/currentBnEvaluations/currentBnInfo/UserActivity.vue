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
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import EventsList from './EventsList.vue';
import NominationResets from './NominationResets.vue';
import Vue from 'vue';

export default {
    name: 'UserActivity',
    components: {
        EventsList,
        NominationResets,
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
        async findRelevantActivity(){
            axios
                .get('/bnEval/userActivity/' + this.osuId + '/' + this.mode + '/' + this.deadline + '/' + this.userMongoId)
                .then(response => {
                    this.nominations = response.data.noms;
                    this.nominationsDisqualified = response.data.nomsDqd;
                    this.nominationsPopped = response.data.nomsPopped;
                    this.disqualifications = response.data.dqs;
                    this.pops = response.data.pops;
                    this.qualityAssuranceChecks = response.data.qualityAssuranceChecks;
                    this.loading = false;
                });
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