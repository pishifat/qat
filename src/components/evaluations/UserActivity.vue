<template>
<div>
    <p class="text-shadow">
        <a :href="noms && '#noms'" data-toggle="collapse">Show unique nominations</a> 
        ({{ loading ? '...' : noms ? noms.length: '0' }})
        <button class="btn btn-sm btn-nat float-right" @click="editing = !editing">{{editing ? 'Disable reason editing' : 'Enable reason editing'}}</button>
    </p>
    <div v-if="noms" class="collapse" id="noms">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
            </thead>
            <tbody>
                <tr v-for="nom in noms" :key="nom.id">
                    <td scope="row">{{new Date(nom.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + nom.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{nom.metadata.length > 70 ? nom.metadata.slice(0,70) + '...' : nom.metadata}}
                        </a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="text-shadow">
        <a :href="nomsDqd && '#nomsDqd'" data-toggle="collapse">Show disqualified nominations</a> 
        ({{ loading ? '...' : nomsDqd ? nomsDqd.length : '0' }})
    </p>
    <div v-if="nomsDqd" class="collapse" id="nomsDqd">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
                <td scope="col">Reason</td>
            </thead>
            <tbody>
                <tr v-for="dq in nomsDqd" :key="dq.id" :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''">
                    <td scope="row">{{new Date(dq.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{dq.metadata.length > 35 ? dq.metadata.slice(0,35) + "..." : dq.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row">{{dq.content}}</td>
                    <td v-else scope="row">
                        <input :class="'input-' + dq._id" type="text" :placeholder="dq.content.length > 35 ? dq.content.slice(0,35) + '...' : dq.content" maxlength="50"/>
                        <button class="btn btn-sm btn-nat" @click="updateReason(dq._id, $event);">Save</button>
                        <notability
                            :selected-entry="dq"
                            :is-spectator="isSpectator"
                        ></notability>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="text-shadow">
        <a :href="nomsPopped && '#nomsPopped'" data-toggle="collapse">Show popped nominations</a> 
        ({{ loading ? '...' : nomsPopped ? nomsPopped.length : '0' }})
    </p>
    <div v-if="nomsPopped" class="collapse" id="nomsPopped">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
                <td scope="col">Reason</td>
            </thead>
            <tbody>
                <tr v-for="pop in nomsPopped" :key="pop.id"
                :class="pop.valid == 1 ? 'vote-border-pass' : pop.valid == 2 ? 'vote-border-extend' : pop.valid == 3 ? 'vote-border-fail' : ''">
                    <td scope="row">{{new Date(pop.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{pop.metadata.length > 35 ? pop.metadata.slice(0,35) + "..." : pop.metadata}}
                        </a></td>
                    <td v-if="!editing" scope="row">{{pop.content}}</td>
                    <td v-else scope="row">
                        <input :class="'input-' + pop._id" type="text" :placeholder="pop.content.length > 35 ? pop.content.slice(0,35) + '...' : pop.content" maxlength="50"/>
                        <button class="btn btn-sm btn-nat" @click="updateReason(pop._id, $event);">Save</button>
                        <notability
                            :selected-entry="pop"
                            :is-spectator="isSpectator"
                        ></notability>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="text-shadow">
        <a :href="dqs && '#dqs'" data-toggle="collapse">Show disqualifications done by user</a> 
        ({{ loading ? '...' : dqs ? dqs.length : '0' }})
    </p>
    <div v-if="dqs" class="collapse" id="dqs">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
                <td scope="col">Reason</td>
            </thead>
            <tbody>
                <tr v-for="dq in dqs" :key="dq.id"
                :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''">
                    <td scope="row">{{new Date(dq.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{dq.metadata.length > 35 ? dq.metadata.slice(0,35) + "..." : dq.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row">{{dq.content}}</td>
                    <td v-else scope="row">
                        <input :class="'input-' + dq._id" type="text" :placeholder="dq.content.length > 35 ? dq.content.slice(0,35) + '...' : dq.content" maxlength="50"/>
                        <button class="btn btn-sm btn-nat" @click="updateReason(dq._id, $event);">Save</button>
                        <notability
                            :selected-entry="dq"
                            :is-spectator="isSpectator"
                        ></notability>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="text-shadow">
        <a :href="pops && '#pops'" data-toggle="collapse">Show pops done by user</a> 
        ({{ loading ? '...' : pops ? pops.length : '0' }})
    </p>
    <div v-if="pops" class="collapse" id="pops">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
                <td scope="col">Reason</td>
            </thead>
            <tbody>
                <tr v-for="pop in pops" :key="pop.id"
                :class="pop.valid == 1 ? 'vote-border-pass' : pop.valid == 2 ? 'vote-border-extend' : pop.valid == 3 ? 'vote-border-fail' : ''">
                    <td scope="row">{{new Date(pop.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{pop.metadata.length > 35 ? pop.metadata.slice(0,35) + "..." : pop.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row">{{pop.content}}</td>
                    <td v-else scope="row">
                        <input :class="'input-' + pop._id" type="text" :placeholder="pop.content.length > 35 ? pop.content.slice(0,35) + '...' : pop.content" maxlength="50"/>
                        <button class="btn btn-sm btn-nat" @click="updateReason(pop._id, $event);">Save</button>
                        <notability
                            :selected-entry="pop"
                            :is-spectator="isSpectator"
                        ></notability>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

</div>

</template>

<script>
import postData from '../../mixins/postData.js'
import Notability from '../dataCollection/Notability.vue'

export default {
    name: 'user-activity',
    props: [ 'eval-round', 'is-spectator' ],
    mixins: [ postData ],
    components: {
        Notability
    },
    watch: {
        evalRound: function() {
            this.editing = false;
            this.loading = true;
            this.findRelevantActivity();
        },
    },
    methods: {
        findRelevantActivity: async function(){
            axios
                .get('/bnEval/userActivity/' + this.evalRound.bn.osuId + '/' + this.evalRound.mode)
                .then(response => {
                    this.noms = response.data.noms;
                    this.nomsDqd = response.data.nomsDqd;
                    this.nomsPopped = response.data.nomsPopped;
                    this.dqs = response.data.dqs;
                    this.pops = response.data.pops;
                    this.loading = false;
                });
        },
        updateEntry: function (obj) {
            this.findRelevantActivity();
        },
        updateReason: async function(entryId, e) {
            this.$parent.info = '';
            let reasonInput = $(`.input-${entryId}`).val();
            if(!reasonInput || !reasonInput.length){
                this.$parent.info = "Must enter a reason!"
            }else if(!this.isSpectator){
                const result = await this.executePost('/dataCollection/updateReason/' + entryId, { reason: reasonInput }, e);
                if (result) {
                    if (result.error) {
                        this.$parent.info = result.error;
                    } else {
                        this.updateEntry(result);
                    }
                }
            }
        },
    },
    data() {
        return {
            noms: null,
            pops: null,
            dqs: null,
            nomsPopped: null,
            nomsDqd: null,
            loading: true,
            editing: false,
        };
    },
    mounted () {
        this.findRelevantActivity();
    }
}
</script>

<style>

</style>