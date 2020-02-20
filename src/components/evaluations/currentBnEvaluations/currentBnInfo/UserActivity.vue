<template>
    <div>
        <events-list
            :events="nominations"
            :events-id="'nominations'"
            :header="'Unique nominations'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-editing="editing = !editing"
        />
        <nomination-resets
            :events="nominationsDisqualified"
            :events-id="'nominationsDisqualified'"
            :header="'Nominations disqualified'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="nominationsPopped"
            :events-id="'nominationsPopped'"
            :header="'Nominations popped'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="disqualifications"
            :events-id="'disqualificationsByUser'"
            :header="'Disqualifications done by user'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="pops"
            :events-id="'popsByUser'"
            :header="'Pops done by user'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <events-list
            :events="qualityAssuranceChecks"
            :events-id="'qualityAssuranceChecks'"
            :header="'Quality Assurance Checks'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-editing="editing = !editing"
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
            editing: false,
        };
    },
    watch: {
        osuId() {
            this.editing = false;
            this.loading = true;
            this.findRelevantActivity();
        },
    },
    mounted () {
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
        updateEntry (event) {
            let i;
            if (event.eventType == 'Disqualified') {
                i = this.disqualifications.findIndex(e => e._id == event.id);

                if (i >= 0) {
                    Vue.set(this.disqualifications, i, event);
                } else {
                    i = this.nominationsDisqualified.findIndex(e => e._id == event.id);
                    Vue.set(this.nominationsDisqualified, i, event);
                }
            } else if (event.eventType == 'Popped') {
                i = this.pops.findIndex(e => e._id == event.id);

                if (i >= 0) {
                    Vue.set(this.pops, i, event);
                } else {
                    i = this.nominationsPopped.findIndex(e => e._id == event.id);
                    Vue.set(this.nominationsPopped, i, event);
                }
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