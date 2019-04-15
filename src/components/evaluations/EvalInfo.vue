<template>
<div id="evaluationInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content custom-bg-dark" v-if="application || evalRound">
            <div class="modal-header text-dark bg-nat-logo">
                <h5 v-if="application" class="modal-title">
                    Application Evaluation: <a @click.stop :href="'https://osu.ppy.sh/users/' + application.applicant.osuId" class="text-dark" target="_blank">{{application.applicant.username}}</a>
                    <i v-if="application.mode == 'osu'" class="far fa-circle"></i>
                    <i v-else-if="application.mode == 'taiko'" class="fas fa-drum"></i>
                    <i v-else-if="application.mode == 'catch'" class="fas fa-apple-alt"></i>
                    <i v-else-if="application.mode == 'mania'" class="fas fa-stream"></i>
                </h5>
                <h5 v-else class="modal-title">
                    BN Evaluation: <a @click.stop :href="'https://osu.ppy.sh/users/' + evalRound.bn.osuId" class="text-dark" target="_blank">{{evalRound.bn.username}}</a>
                    <i v-if="evalRound.mode == 'osu'" class="far fa-circle"></i>
                    <i v-else-if="evalRound.mode == 'taiko'" class="fas fa-drum"></i>
                    <i v-else-if="evalRound.mode == 'catch'" class="fas fa-apple-alt"></i>
                    <i v-else-if="evalRound.mode == 'mania'" class="fas fa-stream"></i>
                </h5>
            </div>
            <div class="modal-body" style="overflow: hidden;">
                <div class="container">
                    <div class="row">
                        <div v-if="application" class="col-sm-12">
                            <p class="text-shadow">Modding:</p>
                            <ul style="list-style-type: disc;">
                                <li class="small text-shadow" v-for="(mod, i) in application.mods" :key="i">
                                    <a :href="modUrl(mod)" target="_blank">{{modUrl(mod)}}</a>
                                </li>
                                <li class="small text-shadow"><a :href="'https://osu.ppy.sh/users/' + application.applicant.osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a></li>
                            </ul>
                            <p class="text-shadow">Test results: 
                                <a href="http://bn.mappersguild.com/testresults" target="_blank" 
                                :class="application.test.totalScore > 15 ? 'vote-pass' : application.test.totalScore > 12.5 ? 'vote-extend' : 'vote-fail'">
                                    {{application.test.totalScore || application.test.totalScore >= 0 ? application.test.totalScore + '/20' : 'incomplete'}}
                                </a>
                            </p>
                            <p class="text-shadow" v-if="application.bnEvaluators.length && evaluator.group == 'nat'">BN Evaluators ({{application.bnEvaluators.length}}): </p>
                            <ul>
                                <li class="small text-shadow" v-for="evaluator in application.bnEvaluators" :key="evaluator.id">{{evaluator.username}}</li>
                            </ul>
                            <div v-if="evaluator.isLeader && !application.bnEvaluators.length">
                                <button class="btn btn-sm btn-nat mb-2" @click="selectBnEvaluators($event)">{{tempBnEvaluators ? 'Re-select BN Evaluators' : 'Select BN Evaluators'}}</button> 
                                <button v-if="tempBnEvaluators" class="btn btn-sm btn-nat-red mb-2" @click="enableBnEvaluators($event)">Enable BN Evaluations</button>
                                <div v-if="tempBnEvaluators" class="text-shadow">
                                    <p>Users:</p>
                                    <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                                        <ul style="list-style-type: none; padding: 0">
                                            <li v-for="user in tempBnEvaluators" :key="user.id"><samp class="small">{{user.username}}</samp></li>
                                        </ul>
                                    </div>
                                    <p>Forum message:</p>
                                    <div id="forumMessage" class="copy-paste">
                                        <samp class="small">Hello!</samp><br><br>
                                        <samp class="small">You have been selected to help evaluate the {{application.mode}} BN application for [url=https://osu.ppy.sh/users/{{application.applicant.osuId}}]{{ application.applicant.username }}[/url].</samp><br><br>
                                        <samp class="small">Please post your opinion regarding the applicant's behavior and modding quality (based on submitted mods and anything else you may know) on the [url=http://bn.mappersguild.com/appeval]BN/NAT website[/url] in [b]one week[/b]. Your decision will be anonymous to everyone but members of the NAT.</samp><br><br>
                                        <samp class="small">If you do not want to participate in BN application evaluations, opt-out from the [url=http://bn.mappersguild.com/users]users page[/url].</samp><br><br>
                                        <samp class="small">Thank you for your hard work!</samp><br><br>
                                    </div>
                                </div>
                            </div>
                            <hr>
                        </div>

                        <div v-if="evalRound" class="col-sm-12">
                            <p class="text-shadow">
                                <a :href="noms && '#noms'" data-toggle="collapse">Show unique nominations</a> 
                                ({{ loading ? '...' : noms ? noms.length: '0' }})
                            </p>
                            <div v-if="noms" class="collapse" id="noms">
                                <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                                    <thead>
                                        <td scope="col">Date</td>
                                        <td scope="col">Mapset</td>
                                    </thead>
                                    <tbody>
                                        <tr v-for="nom in noms" :key="nom.id">
                                            <td scope="row">{{new Date(nom.timestamp).toString().slice(4,15)}}</td>
                                            <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + nom.beatmapsetId + '/discussion/-/events'" target="_blank">{{nom.metadata}}</a></td>
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
                                            <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                                            <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">{{dq.metadata}}</a></td>
                                            <td scope="row">{{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}}</td>
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
                                            <td scope="row">{{new Date(pop.timestamp).toString().slice(4,15)}}</td>
                                            <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">{{pop.metadata}}</a></td>
                                            <td scope="row">{{pop.content.slice(0, pop.content.indexOf('.')+1) || pop.content}}</td>
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
                                            <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                                            <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">{{dq.metadata}}</a></td>
                                            <td scope="row">{{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}}</td>
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
                                            <td scope="row">{{new Date(pop.timestamp).toString().slice(4,15)}}</td>
                                            <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">{{pop.metadata}}</a></td>
                                            <td scope="row">{{pop.content.slice(0, pop.content.indexOf('.')+1) || pop.content}}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-if="relevantReports.length">
                                <hr>
                                <p class="text-shadow">Reports:</p>
                                <div v-for="report in relevantReports" :key="report.id">
                                    <p class="text-shadow small pl-2" :class="report.valid == 1 ? 'vote-pass' : 'vote-extend'">
                                        {{report.createdAt.slice(0,10)}}: {{report.reason}}
                                    </p>
                                </div>
                            </div>
                            <hr>
                        </div>
                        
                        
                        <div class="col-sm-6">
                            <p class="text-shadow">Behavior/attitude comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" id="behaviorComments" rows="4" v-model="behaviorComment"></textarea>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <p class="text-shadow">Modding comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" id="moddingComments" rows="4" v-model="moddingComment"></textarea>
                            </div>
                        </div>
                        <div class="col-sm-12 mb-2">
                            <span class="mr-3 text-shadow">Vote:</span>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="1" value="1" v-model="vote">
                                <label class="form-check-label text-shadow vote-pass" for="1">Pass</label>
                            </div>
                            <div v-if="application" class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="2" value="2" v-model="vote">
                                <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                            </div>
                            <div v-else class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="2" value="2" v-model="vote">
                                <label class="form-check-label text-shadow vote-extend" for="2">Extend</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="3" value="3" v-model="vote">
                                <label class="form-check-label text-shadow vote-fail" for="3">Fail</label>
                            </div>
                        </div>
                    </div>
                    <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">{{info}} {{confirm}}</div>
                </div>
            </div>
            <div class="modal-footer" style="overflow: hidden;">
                <button class="btn btn-sm btn-nat" @click="submitEval($event)">{{evaluationId ? 'Update Evaluation' : 'Submit Evaluation'}}</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from '../../mixins/postData.js'

export default {
    name: 'eval-info',
    props: [ 'application', 'evalRound', 'reports', 'evaluator' ],
    mixins: [ postData ],
    watch: {
        application: function() {
            this.info = '';
            this.confirm = '';
            this.tempBnEvaluators = null;
            this.findRelevantEval();
        },
        evalRound: function() {
            this.info = '';
            this.confirm = '';
            this.findRelevantEval();
            if(this.reports && this.reports.length) this.findRelevantReports();
            this.findRelevantActivity();
        },
    },
    methods: {
        //display
        findRelevantEval: function(){
            this.evaluationId = null;
            this.behaviorComment = '';
            this.moddingComment = '';
            this.vote = 0;
            // $("input[name=vote]").prop("checked",false);

            if(this.application){
                this.application.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator.id){
                        this.evaluationId = ev.id;
                        this.behaviorComment = ev.behaviorComment;
                        this.moddingComment = ev.moddingComment;
                        this.vote = ev.vote;
                    }
                });
            }else{
                this.evalRound.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator.id){
                        this.evaluationId = ev.id;
                        this.behaviorComment = ev.behaviorComment;
                        this.moddingComment = ev.moddingComment;
                        this.vote = ev.vote;
                    }
                });
            }
            
        },
        findRelevantReports: function() {
            this.relevantReports = this.reports.filter( report => 
                report.culprit == this.evalRound.bn.id);
        },
        findRelevantActivity: function() {
            this.loading = true;
            axios
                .get('/bnEval/userActivity/' + this.evalRound.bn.osuId + '/' + this.evalRound.mode)
                .then(response => {
                    this.noms = response.data.noms;
                    this.nomsDqd = response.data.nomsDqd;
                    this.nomsPopped = response.data.nomsPopped;
                    this.dqs = response.data.dqs;
                    this.pops = response.data.pops;
                    this.loading = false;
                })
        },
        createDeadline: function(date){
            date = new Date(date);
            date = new Date(date.setDate (date.getDate() + 7)).toString().slice(4,10);
            return date;
        },
        modUrl: function(mod){
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && (mod.indexOf("#") < 0 || mod.indexOf("#") > 40)) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.application.applicant.osuId}`;
            }else{
                return mod;
            }
        },

        //action
        submitEval: async function (e) {
            if(!this.vote || !this.behaviorComment.length || !this.moddingComment.length){
                this.info = 'Cannot leave fields blank!'
            }else{
                if(this.application){
                    const a = await this.executePost(
                        '/appEval/submitEval/' + this.application.id, 
                        { evaluationId: this.evaluationId, 
                        vote: this.vote, 
                        behaviorComment: this.behaviorComment, 
                        moddingComment: this.moddingComment
                        }, e);
                    
                    if (a) {
                        if (a.error) {
                            this.info = a.error;
                        } else {
                            await this.$emit('update-application', a);
                            if(this.evaluationId){
                                this.confirm = "Evaluation updated!"
                            }else{
                                this.confirm = "Evaluation submitted!"
                            }
                        }
                    }
                }else{
                    const er = await this.executePost(
                        '/bnEval/submitEval/' + this.evalRound.id, 
                        { evaluationId: this.evaluationId, 
                        vote: this.vote, 
                        behaviorComment: this.behaviorComment, 
                        moddingComment: this.moddingComment
                        }, e);
                    if (er) {
                        if (er.error) {
                            this.info = er.error;
                        } else {
                            await this.$emit('update-eval-round', er);
                            if(this.evaluationId){
                                this.confirm = "Evaluation updated!"
                            }else{
                                this.confirm = "Evaluation submitted!"
                            }
                        }
                    }
                }
                
            }
        },
        selectBnEvaluators: async function(e) {
            const r = await this.executePost('/appeval/selectBnEvaluators', {mode: this.application.mode}, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.tempBnEvaluators = r;
                }
            }
        },
        enableBnEvaluators: async function (e) {
            const a = await this.executePost('/appEval/enableBnEvaluators/' + this.application.id, { bnEvaluators: this.tempBnEvaluators }, e);
            if (a) {
                if (a.error) {
                    this.info = a.error;
                } else {
                    await this.$emit('update-application', a);
                    this.confirm = "Evaluations by selected BNs have been enabled!"
                }
            }
		},
    },
    data() {
        return {
            evaluationId: '',
            behaviorComment: '',
            moddingComment: '',
            relevantReports: [],
            vote: 0,
            info: '',
            confirm: '',
            noms: null,
            pops: null,
            dqs: null,
            nomsPopped: null,
            nomsDqd: null,
            tempBnEvaluators: null,
            loading: true,
        };
    },
}
</script>

<style>

</style>