<template>
    <div>
        <unique-nominations
            :nominations="nominations"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-editing="editing = !editing"
        />
        <nomination-resets
            :events="nominationsDisqualified"
            :eventsId="'nominationsDisqualified'"
            :header="'Nominations disqualified'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="nominationsPopped"
            :eventsId="'nominationsPopped'"
            :header="'Nominations popped'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="disqualifications"
            :eventsId="'disqualificationsByUser'"
            :header="'Disqualifications done by user'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
        <nomination-resets
            :events="pops"
            :eventsId="'popsByUser'"
            :header="'Pops done by user'"
            :loading="loading"
            :editing="editing"
            :is-nat="isNat"
            @update-entry="updateEntry($event)"
        />
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import UniqueNominations from './UniqueNominations.vue';
import NominationResets from './NominationResets.vue';
import Vue from 'vue';

export default {
    name: 'UserActivity',
    components: {
        UniqueNominations,
        NominationResets,
    },
    mixins: [ postData, filterLinks ],
    props: {
        osuId: Number,
        mode: String,
        deadline: String,
        isNat: Boolean,
    },
    data() {
        return {
            nominations: null,
            pops: null,
            disqualifications: null,
            nominationsPopped: null,
            nominationsDisqualified: null,
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
                .get('/bnEval/userActivity/' + this.osuId + '/' + this.mode + '/' + this.deadline)
                .then(response => {
                    this.nominations = response.data.noms;
                    this.nominationsDisqualified = response.data.nomsDqd;
                    this.nominationsPopped = response.data.nomsPopped;
                    this.disqualifications = response.data.dqs;
                    this.pops = response.data.pops;
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