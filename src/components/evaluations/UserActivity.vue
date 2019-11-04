<template>
    <div>
        <p class="text-shadow">
            <a :href="noms && '#noms'" data-toggle="collapse">Show unique nominations</a> 
            ({{ loading ? '...' : noms ? noms.length: '0' }})
            <button class="btn btn-sm btn-nat float-right" @click="editing = !editing">
                {{ editing ? 'Disable reason editing' : 'Enable reason editing' }}
            </button>
        </p>
        <div v-if="noms" id="noms" class="collapse">
            <table v-if="noms.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">
                        Date
                    </td>
                    <td scope="col">
                        Mapset
                    </td>
                </thead>
                <tbody class="small">
                    <tr v-for="nom in noms" :key="nom.id">
                        <td scope="row">
                            {{ new Date(nom.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + nom.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ nom.metadata.length > 90 ? nom.metadata.slice(0,90) + '...' : nom.metadata }}
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
        <p class="text-shadow">
            <a :href="nomsDqd && '#nomsDqd'" data-toggle="collapse">Show disqualified nominations</a> 
            ({{ loading ? '...' : nomsDqd ? nomsDqd.length : '0' }})
        </p>
        <div v-if="nomsDqd" id="nomsDqd" class="collapse">
            <table v-if="nomsDqd.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col" class="w-10">
                        Date
                    </td>
                    <td scope="col" class="w-30">
                        Mapset
                    </td>
                    <td scope="col" class="w-60">
                        Reason
                    </td>
                </thead>
                <tbody class="small">
                    <tr v-for="dq in nomsDqd" :key="dq.id" :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''">
                        <td scope="row">
                            {{ new Date(dq.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ dq.metadata.length > 30 ? dq.metadata.slice(0,30).trim() + "..." : dq.metadata }}
                            </a>
                        </td>
                        <td v-if="!editing" scope="row" v-html="filterLinks(dq.content)" />
                        <td v-else scope="row">
                            <input class="w-60" :class="'input-' + dq._id" type="text" :placeholder="dq.content.length > 40 ? dq.content.slice(0,40) + '...' : dq.content" maxlength="100">
                            <button class="btn btn-xs btn-nat" @click="updateReason(dq._id, $event);">
                                Save
                            </button>
                            <notability
                                :selected-entry="dq"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
        <p class="text-shadow">
            <a :href="nomsPopped && '#nomsPopped'" data-toggle="collapse">Show popped nominations</a> 
            ({{ loading ? '...' : nomsPopped ? nomsPopped.length : '0' }})
        </p>
        <div v-if="nomsPopped" id="nomsPopped" class="collapse">
            <table v-if="nomsPopped.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col" class="w-10">
                        Date
                    </td>
                    <td scope="col" class="w-30">
                        Mapset
                    </td>
                    <td scope="col" class="w-60">
                        Reason
                    </td>
                </thead>
                <tbody class="small">
                    <tr
                        v-for="pop in nomsPopped"
                        :key="pop.id"
                        :class="pop.valid == 1 ? 'vote-border-pass' : pop.valid == 2 ? 'vote-border-extend' : pop.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">
                            {{ new Date(pop.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ pop.metadata.length > 30 ? pop.metadata.slice(0,30).trim() + "..." : pop.metadata }}
                            </a>
                        </td>
                        <td v-if="!editing" scope="row" v-html="filterLinks(pop.content)" />
                        <td v-else scope="row">
                            <input class="w-60" :class="'input-' + pop._id" type="text" :placeholder="pop.content.length > 40 ? pop.content.slice(0,40) + '...' : pop.content" maxlength="100">
                            <button class="btn btn-xs btn-nat" @click="updateReason(pop._id, $event);">
                                Save
                            </button>
                            <notability
                                :selected-entry="pop"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
        <p class="text-shadow">
            <a :href="dqs && '#dqs'" data-toggle="collapse">Show disqualifications done by user</a> 
            ({{ loading ? '...' : dqs ? dqs.length : '0' }})
        </p>
        <div v-if="dqs" id="dqs" class="collapse">
            <table v-if="dqs.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col" class="w-10">
                        Date
                    </td>
                    <td scope="col" class="w-30">
                        Mapset
                    </td>
                    <td scope="col" class="w-60">
                        Reason
                    </td>
                </thead>
                <tbody class="small">
                    <tr
                        v-for="dq in dqs"
                        :key="dq.id"
                        :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">
                            {{ new Date(dq.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ dq.metadata.length > 30 ? dq.metadata.slice(0,30).trim() + "..." : dq.metadata }}
                            </a>
                        </td>
                        <td v-if="!editing" scope="row" v-html="filterLinks(dq.content)" />
                        <td v-else scope="row">
                            <input class="w-60" :class="'input-' + dq._id" type="text" :placeholder="dq.content.length > 40 ? dq.content.slice(0,40) + '...' : dq.content" maxlength="100">
                            <button class="btn btn-xs btn-nat" @click="updateReason(dq._id, $event);">
                                Save
                            </button>
                            <notability
                                :selected-entry="dq"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
        <p class="text-shadow">
            <a :href="pops && '#pops'" data-toggle="collapse">Show pops done by user</a> 
            ({{ loading ? '...' : pops ? pops.length : '0' }})
        </p>
        <div v-if="pops" id="pops" class="collapse">
            <table v-if="pops.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col" class="w-10">
                        Date
                    </td>
                    <td scope="col" class="w-30">
                        Mapset
                    </td>
                    <td scope="col" class="w-60">
                        Reason
                    </td>
                </thead>
                <tbody class="small">
                    <tr
                        v-for="pop in pops"
                        :key="pop.id"
                        :class="pop.valid == 1 ? 'vote-border-pass' : pop.valid == 2 ? 'vote-border-extend' : pop.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">
                            {{ new Date(pop.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ pop.metadata.length > 30 ? pop.metadata.slice(0,30).trim() + "..." : pop.metadata }}
                            </a>
                        </td>
                        <td v-if="!editing" scope="row" v-html="filterLinks(pop.content)" />
                        <td v-else scope="row">
                            <input class="w-60" :class="'input-' + pop._id" type="text" :placeholder="pop.content.length > 40 ? pop.content.slice(0,40) + '...' : pop.content" maxlength="100">
                            <button class="btn btn-xs btn-nat" @click="updateReason(pop._id, $event);">
                                Save
                            </button>
                            <notability
                                :selected-entry="pop"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
        <div>
            <p class="text-shadow">
                <a href="#additionalInfo" data-toggle="collapse">Additional Info <i class="fas fa-angle-down" /></a> 
                <a
                    v-if="!evalRound.discussion"
                    href="#"
                    class="float-right small vote-pass ml-2"
                    data-toggle="tooltip"
                    data-placement="top"
                    :title="evalRound.isPriority ? 'mark evaluation as low priority' : 'mark evaluation as high priority'"
                    @click.prevent.stop="toggleIsPriority()"
                >
                    <i class="fas" :class="evalRound.isPriority ? 'fa-arrow-down' : 'fa-arrow-up'" />
                </a>
            </p>
            <div id="additionalInfo" class="collapse row col-sm-12 mx-2 pt-1">
                <div class="col-sm-12">
                    <p class="min-spacing text-shadow">
                        Previous evaluations:
                    </p>
                    <ul v-if="previousEvaluations">
                        <li v-for="evaluation in previousEvaluations" :key="evaluation.id" class="small text-shadow">
                            <a :href="'http://bn.mappersguild.com/evalarchive?eval=' + evaluation.id">{{ evaluation.updatedAt.slice(0,10) }} - {{evaluation.applicant ? "APP" : "BN EVAL"}}</a> - <span :class="'vote-' + evaluation.consensus">{{ evaluation.consensus.toUpperCase() }}</span>
                            <pre class="secondary-text pre-font ml-2">{{ evaluation.feedback }}</pre>
                        </li>
                    </ul>
                </div>
                <div class="col-sm-12">
                    <p class="min-spacing text-shadow">
                        NAT user notes:
                    </p>
                    <ul v-if="userNotes">
                        <li v-if="!userNotes.length" class="small min-spacing text-shadow">User has no notes</li>
                        <li v-else v-for="note in userNotes" :key="note.id" class="small text-shadow">
                            <b>{{ note.updatedAt.slice(0,10) }} - {{ note.author.username }}</b>
                            <pre class="secondary-text pre-font ml-2">{{ note.comment }}</pre>
                        </li>
                    </ul>
                </div>
                <div class="col-sm-12">
                    <p class="min-spacing text-shadow">
                        Reports:
                    </p>
                    <ul v-if="userReports">
                        <li v-if="!userReports.length" class="small min-spacing text-shadow">User has no reports</li>
                        <li v-else v-for="report in userReports" :key="report.id" class="small text-shadow">
                            <a :href="'http://bn.mappersguild.com/managereports?report=' + report.id">{{ report.createdAt.slice(0,10) }}</a>
                            <pre class="secondary-text pre-font ml-2" :class="report.valid == 1 ? 'vote-pass' : 'vote-extend'"> <span v-html="filterLinks(report.reason)" /></pre>
                        </li>
                    </ul>
                </div>
                <button
                    class="btn btn-sm btn-nat mx-2 mb-2 minw-200"
                    data-toggle="tooltip"
                    data-placement="right"
                    title="Finds unique mod count in the last 90 days. Only use on BNs with low activity"
                    @click="findModCount()"
                >
                    Load modding activity
                </button>
                <div class="col-sm-12">
                    <span v-if="loadingModCount" class="small">Finding mods (this will take a few seconds...)</span>
                    <ul v-if="modCount" class="text-shadow">
                        <li class="min-spacing small">
                            Month 1: {{ modCount[0] }}
                        </li>
                        <li class="min-spacing small">
                            Month 2: {{ modCount[1] }}
                        </li>
                        <li class="min-spacing small">
                            Month 3: {{ modCount[2] }}
                        </li>
                    </ul>
                </div>
                <div v-if="!evalRound.discussion" class="col-sm-12">
                    <p class="text-shadow min-spacing">
                        Total Evaluations: {{ evalRound.evaluations.length }}
                    </p>
                    <ul>
                        <li v-for="evaluation in evalRound.evaluations" :key="evaluation.id" class="small text-shadow">
                            {{ evaluation.evaluator.username }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import Notability from '../dataCollection/Notability.vue';

export default {
    name: 'UserActivity',
    components: {
        Notability,
    },
    mixins: [ postData, filterLinks ],
    props: [ 'evalRound' ],
    data() {
        return {
            noms: null,
            pops: null,
            dqs: null,
            nomsPopped: null,
            nomsDqd: null,
            loading: true,
            editing: false,
            loadingModCount: false,
            modCount: null,
            previousEvaluations: null,
            userNotes: null,
            userReports: null,
        };
    },
    watch: {
        evalRound() {
            this.editing = false;
            this.loading = true;
            this.loadingModCount = false;
            this.modCount = null;
            this.previousEvaluations = null;
            this.userNotes = null;
            this.findRelevantActivity();
            this.findPreviousEvaluations();
            this.findUserNotes();
            this.findUserReports();
        },
    },
    mounted () {
        this.findRelevantActivity();
        this.findPreviousEvaluations();
        this.findUserNotes();
        this.findUserReports();
    },
    methods: {
        async findRelevantActivity(){
            axios
                .get('/bnEval/userActivity/' + this.evalRound.bn.osuId + '/' + this.evalRound.mode + '/' + this.evalRound.deadline)
                .then(response => {
                    this.noms = response.data.noms;
                    this.nomsDqd = response.data.nomsDqd;
                    this.nomsPopped = response.data.nomsPopped;
                    this.dqs = response.data.dqs;
                    this.pops = response.data.pops;
                    this.loading = false;
                });
        },
        async findModCount() {
            this.loadingModCount = true;
            axios
                .get('/modsCount/' + this.evalRound.bn.username)
                .then(response => {
                    this.loadingModCount = false;
                    this.modCount = response.data.modCount;
                });
        },
        async findPreviousEvaluations() {
            axios
                .get('/bnEval/findPreviousEvaluations/' + this.evalRound.bn.id)
                .then(response => {
                    this.previousEvaluations = response.data.previousEvaluations;
                });
        },
        async findUserNotes() {
            axios
                .get('/bnEval/findUserNotes/' + this.evalRound.bn.id)
                .then(response => {
                    this.userNotes = response.data.userNotes;
                });
        },
        async findUserReports() {
            axios
                .get('/bnEval/findUserReports/' + this.evalRound.bn.id)
                .then(response => {
                    this.userReports = response.data.userReports;
                });
        },
        updateEntry () {
            this.findRelevantActivity();
        },
        async toggleIsPriority() {
            const er = await this.executePost(
                '/bnEval/toggleIsPriority/' + this.evalRound.id, { isPriority: this.evalRound.isPriority });
            if (er) {
                if (er.error) {
                    this.info = er.error;
                } else {
                    await this.$parent.$emit('update-eval-round', er);
                }
            } 
        },
        async updateReason(entryId, e) {
            this.$parent.info = '';
            let reasonInput = $(`.input-${entryId}`).val();
            if(!reasonInput || !reasonInput.length){
                this.$parent.info = 'Must enter a reason!';
            }else{
                const result = await this.executePost('/dataCollection/updateReason/' + entryId, { reason: reasonInput }, e);
                if (result) {
                    if (result.error) {
                        this.$parent.info = result.error;
                    } else {
                        this.updateEntry();
                    }
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