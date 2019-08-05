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
                        <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{dq.metadata.length > 35 ? dq.metadata.slice(0,35) + "..." : dq.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row" v-html="filterLinks(dq.content)"></td>
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
                        <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{pop.metadata.length > 35 ? pop.metadata.slice(0,35) + "..." : pop.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row" v-html="filterLinks(pop.content)"></td>
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
                        <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{dq.metadata.length > 35 ? dq.metadata.slice(0,35) + "..." : dq.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row" v-html="filterLinks(dq.content)"></td>
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
                        <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{pop.metadata.length > 35 ? pop.metadata.slice(0,35) + "..." : pop.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row" v-html="filterLinks(pop.content)"></td>
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
        <a :href="reports && '#reports'" data-toggle="collapse">Show reports done by user</a> 
        ({{ loading ? '...' : reports ? reports.length : '0' }})
    </p>
    <div v-if="reports" class="collapse" id="reports">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Date</td>
                <td scope="col">Mapset</td>
                <td scope="col">Reason</td>
            </thead>
            <tbody>
                <tr v-for="report in reports" :key="report.id"
                :class="report.valid == 1 ? 'vote-border-pass' : report.valid == 2 ? 'vote-border-extend' : report.valid == 3 ? 'vote-border-fail' : ''">
                    <td scope="row">{{new Date(report.timestamp).toString().slice(4,10)}}</td>
                    <td scope="row">
                        <a :href="report.forumPostId > 0 ? 'https://osu.ppy.sh/community/forums/topics/447428?start=' + report.forumPostId : 'https://osu.ppy.sh/beatmapsets/' + report.beatmapsetId + '/discussion/-/events'" target="_blank">
                            {{report.metadata.length > 35 ? report.metadata.slice(0,35) + "..." : report.metadata}}
                        </a>
                    </td>
                    <td v-if="!editing" scope="row" v-html="filterLinks(report.content)"></td>
                    <td v-else scope="row">
                        <input :class="'input-' + report._id" type="text" :placeholder="report.content.length > 35 ? report.content.slice(0,35) + '...' : report.content" maxlength="50"/>
                        <button class="btn btn-sm btn-nat" @click="updateReason(report._id, $event);">Save</button>
                        <notability
                            :selected-entry="report"
                            :is-spectator="isSpectator"
                        ></notability>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div>
        <button class="btn btn-sm btn-nat mx-2 mb-2 w-25" @click="findModCount()"
            data-toggle="tooltip" data-placement="top" title="Finds unique mod count in the last 90 days. Only use on BNs with low activity">Load modding activity
        </button>
        <span v-if="loadingModCount" class="small">Finding mods (this will take a few seconds...)</span>
        <ul v-if="modCount" class="text-shadow">
            <li class="min-spacing small">Month 1: {{modCount[0]}}</li>
            <li class="min-spacing small">Month 2: {{modCount[1]}}</li>
            <li class="min-spacing small">Month 3: {{modCount[2]}}</li>
        </ul>
    </div>
    <div>
        <button class="btn btn-sm btn-nat mx-2 mb-2 w-25" @click="findPreviousEvaluations()"
            data-toggle="tooltip" data-placement="top" title="Finds previous evaluation results">Load old evaluations
        </button>
        <ul v-if="previousEvaluations">
            <li class="small text-shadow" v-for="evaluation in previousEvaluations" :key="evaluation.id">
                <b>{{evaluation.updatedAt.slice(0,10)}} - {{evaluation.consensus.toUpperCase()}}</b>: {{evaluation.feedback}}
            </li>
        </ul>
    </div>

</div>

</template>

<script>
import postData from '../../mixins/postData.js'
import filterLinks from '../../mixins/filterLinks.js'
import Notability from '../dataCollection/Notability.vue'

export default {
    name: 'user-activity',
    props: [ 'eval-round', 'is-spectator' ],
    mixins: [ postData, filterLinks ],
    components: {
        Notability
    },
    watch: {
        evalRound: function() {
            this.editing = false;
            this.loading = true;
            this.loadingModCount = false;
            this.modCount = null;
            this.previousEvaluations = null;
            this.findRelevantActivity();
        },
    },
    methods: {
        findRelevantActivity: async function(){
            axios
                .get('/bnEval/userActivity/' + this.evalRound.bn.osuId + '/' + this.evalRound.mode + '/' + this.evalRound.deadline)
                .then(response => {
                    this.noms = response.data.noms;
                    this.nomsDqd = response.data.nomsDqd;
                    this.nomsPopped = response.data.nomsPopped;
                    this.dqs = response.data.dqs;
                    this.pops = response.data.pops;
                    this.reports = response.data.reports;
                    this.loading = false;
                });
        },
        findModCount: async function() {
            this.loadingModCount = true;
            axios
                .get('/bnapps/currentBnMods/' + this.evalRound.bn.username)
                .then(response => {
                    this.loadingModCount = false;
                    this.modCount = response.data.modCount;
                });
        },
        findPreviousEvaluations: async function() {
            axios
                .get('/bnEval/findPreviousEvaluations/' + this.evalRound.bn.id)
                .then(response => {
                    this.previousEvaluations = response.data.previousEvaluations;
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
            reports: null,
            nomsPopped: null,
            nomsDqd: null,
            loading: true,
            editing: false,
            loadingModCount: false,
            modCount: null,
            previousEvaluations: null,
        };
    },
    mounted () {
        this.findRelevantActivity();
    }
}
</script>

<style>

</style>