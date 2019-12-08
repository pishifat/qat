<template>
    <div>
        <unique-nominations
            :nominations="nominations"
            :loading="loading"
            :editing="editing"
            @update-editing="editing = !editing"
        />
        <nomination-resets
            :events="nominationsDisqualified"
            :eventsId="'nominationsDisqualified'"
            :header="'Nominations disqualified'"
            :loading="loading"
            :editing="editing"
            @update-entry="updateEntry()"
        />
        <nomination-resets
            :events="nominationsPopped"
            :eventsId="'nominationsPopped'"
            :header="'Nominations popped'"
            :loading="loading"
            :editing="editing"
            @update-entry="updateEntry()"
        />
        <nomination-resets
            :events="disqualifications"
            :eventsId="'disqualificationsByUser'"
            :header="'Disqualifications done by user'"
            :loading="loading"
            :editing="editing"
            @update-entry="updateEntry()"
        />
        <nomination-resets
            :events="pops"
            :eventsId="'popsByUser'"
            :header="'Pops done by user'"
            :loading="loading"
            :editing="editing"
            @update-entry="updateEntry()"
        />
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import Notability from '../../../dataCollection/Notability.vue';
import UniqueNominations from './UniqueNominations.vue';
import NominationResets from './NominationResets.vue';

export default {
    name: 'UserActivity',
    components: {
        Notability,
        UniqueNominations,
        NominationResets,
    },
    mixins: [ postData, filterLinks ],
    props: [ 'evalRound' ],
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
        evalRound() {
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
                .get('/bnEval/userActivity/' + this.evalRound.bn.osuId + '/' + this.evalRound.mode + '/' + this.evalRound.deadline)
                .then(response => {
                    this.nominations = response.data.noms;
                    this.nominationsDisqualified = response.data.nomsDqd;
                    this.nominationsPopped = response.data.nomsPopped;
                    this.disqualifications = response.data.dqs;
                    this.pops = response.data.pops;
                    this.loading = false;
                });
        },
        updateEntry () {
            this.findRelevantActivity();
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