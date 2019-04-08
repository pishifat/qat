<template>
<div id="discussionInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content custom-bg-dark" v-if="discussApp || discussRound">
            <div class="modal-header text-dark bg-nat-logo">
                <h5 v-if="discussApp" class="modal-title">
                    Application Evaluation: <a @click.stop :href="'https://osu.ppy.sh/users/' + discussApp.applicant.osuId" class="text-dark" target="_blank">{{discussApp.applicant.username}}</a>
                    <i v-if="discussApp.mode == 'osu'" class="far fa-circle"></i>
                    <i v-else-if="discussApp.mode == 'taiko'" class="fas fa-drum"></i>
                    <i v-else-if="discussApp.mode == 'catch'" class="fas fa-apple-alt"></i>
                    <i v-else-if="discussApp.mode == 'mania'" class="fas fa-stream"></i>
                </h5>
                <h5 v-else class="modal-title">
                    BN Evaluation: <a @click.stop :href="'https://osu.ppy.sh/users/' + discussRound.bn.osuId" class="text-dark" target="_blank">{{discussRound.bn.username}}</a>
                    <i v-if="discussRound.mode == 'osu'" class="far fa-circle"></i>
                    <i v-else-if="discussRound.mode == 'taiko'" class="fas fa-drum"></i>
                    <i v-else-if="discussRound.mode == 'catch'" class="fas fa-apple-alt"></i>
                    <i v-else-if="discussRound.mode == 'mania'" class="fas fa-stream"></i>
                </h5>
            </div>
            <div class="modal-body" style="overflow: hidden;">
                <div class="container">
                    <div class="row">
                        <h5 v-if="discussRound" class="text-shadow mb-3 ml-1 mt-1">Consensus:
                            <span v-if="discussRound.consensus" :class="'vote-' + discussRound.consensus">{{discussRound.consensus}}</span>
                            <span v-else>none</span>
                            <span v-if="!readOnly">
                            <button
                                class="btn btn-sm btn-nat-pass"
                                :disabled="discussRound.consensus == 'pass' "
                                @click="setConsensus('pass', $event);"
                            >Set Pass</button>
                            <button
                                class="btn btn-sm btn-nat-extend"
                                :disabled="discussRound.consensus == 'extend' "
                                @click="setConsensus('extend', $event);"
                            >Set Extend</button>
                            <button
                                class="btn btn-sm btn-nat-fail"
                                :disabled="discussRound.consensus == 'fail'"
                                @click="setConsensus('fail', $event);"
                            >Set Fail</button>
                            </span>
                        </h5>
                        <div v-if="discussApp" class="col-sm-12">
                            <p class="text-shadow">Submitted mods:</p>
                            <ul style="list-style-type: none;">
                                <li class="small text-shadow" v-for="(mod, i) in discussApp.mods" :key="i">
                                    <a :href="modUrl(mod)" target="_blank">{{modUrl(mod)}}</a>
                                </li>
                            </ul>
                            <p class="text-shadow">Test results: 
                                <span :class="discussApp.test.totalScore > 15 ? 'vote-pass' : discussApp.test.totalScore > 12.5 ? 'vote-extend' : 'vote-fail'">
                                    {{discussApp.test.totalScore || discussApp.test.totalScore >= 0 ? discussApp.test.totalScore + '/20' : 'incomplete'}}
                                </span>
                            </p>
                            <h5 class="text-shadow mb-2" v-if="!readOnly">Consensus:
                                <span v-if="discussApp.consensus" :class="'vote-' + discussApp.consensus">{{discussApp.consensus}}</span>
                                <span v-else>none</span>
                                <button
                                    class="btn btn-sm btn-nat-pass"
                                    :disabled="discussApp.consensus == 'pass' "
                                    @click="setConsensus('pass', $event);"
                                >Set Pass</button>
                                <button
                                    class="btn btn-sm btn-nat-fail"
                                    :disabled="discussApp.consensus == 'fail'"
                                    @click="setConsensus('fail', $event);"
                                >Set Fail</button>
                            </h5>
                            <div v-if="discussApp.consensus && !readOnly">
                                <hr>
                                <p class="text-shadow min-spacing mb-2">Application feedback: <button class="btn btn-sm btn-nat" @click="setFeedback($event);">Generate Feedback PM</button></p>
                                <div class="form-group">
                                    <textarea class="form-control dark-textarea" style="white-space: pre-line;" v-model="feedback"></textarea>
                                </div>
                                <div v-if="discussApp.consensus == 'pass'" class="copy-paste">
                                    <samp class="small">Hello!</samp><br><br>
                                    <samp class="small">Following a positive evaluation of your {{discussApp.mode}} BN application, you've been invited to join the Beatmap Nominators. Congratulations!</samp><br><br>
                                    <samp class="small">[notice][b]Important information:[/b]</samp><br>
                                    <samp class="small">[list][*]You will be on probation for your first month as a BN. This means you can only nominate beatmaps that have been nominated by non-probation BNs, and you cannot disqualify beatmaps.</samp><br><br>
                                    <samp class="small">[*]At the end of your probation period, your activity/attitude/nomination quality will be evaluated by members of the NAT. If each of these areas are satisfactory, your probation period will be complete. If not, your probation will be extended for another month. or you'll be dismissed from the BN. In that second case, you will not be able to re-apply for another 90 days.</samp><br><br>
                                    <samp class="small">[*]Read [url=https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules]this page[/url] and follow the golden rule: [i]don't fuck up[/i].[/list][/notice]</samp><br><br>
                                    <samp class="small">Additional feedback from the NAT:</samp><br><br>
                                    <samp class="small">[notice]{{discussApp.feedback}}[/notice]</samp><br><br>
                                    <samp class="small">We hope you have fun as a Beatmap Nominator!</samp>
                                </div>
                                <div v-else class="copy-paste">
                                    <samp class="small">Hello!</samp><br><br>
                                    <samp class="small">Following an evaluation of your {{discussApp.mode}} BN application, we've decided not to admit you into the Beatmap Nominators.</samp><br><br>
                                    <samp class="small">Additional feedback regarding why you were rejected and what you could potentially improve in your next application:</samp><br><br>
                                    <samp class="small">[notice]{{discussApp.feedback}}[/notice]</samp><br><br>
                                    <samp class="small">You may apply for BN in this game mode again after 90 days. Good luck!</samp>
                                </div>
                            </div>
                            <hr>
                        </div>
                        <div v-else-if="!readOnly" class="col-sm-12">
                            <div class="col-sm-12">
                                <p class="text-shadow"><a :href="noms && '#noms'" data-toggle="collapse">Show unique nominations</a> ({{noms ? noms.length: '0'}})</p>
                                <div v-if="noms" class="collapse" id="noms">
                                    <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                                        <thead>
                                            <td scope="col">Date</td>
                                            <td scope="col">Mapset</td>
                                        </thead>
                                        <tbody>
                                            <tr v-for="nom in noms" :key="nom.id">
                                                <td scope="row">{{new Date(nom.timestamp).toString().slice(4,15)}}</td>
                                                <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + nom.beatmapsetId + '/discussion'" target="_blank">{{nom.metadata}}</a></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p class="text-shadow"><a :href="nomsDqd && '#nomsDqd'" data-toggle="collapse">Show disqualified nominations</a> ({{nomsDqd ? nomsDqd.length : '0'}})</p>
                                <div v-if="nomsDqd" class="collapse" id="nomsDqd">
                                    <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                                        <thead>
                                            <td scope="col">Date</td>
                                            <td scope="col">Mapset</td>
                                            <td scope="col">Reason</td>
                                        </thead>
                                        <tbody>
                                            <tr v-for="dq in nomsDqd" :key="dq.id" 
                                            :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''">
                                                <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                                                <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion'" target="_blank">{{dq.metadata}}</a></td>
                                                <td scope="row">{{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p class="text-shadow"><a :href="nomsPopped && '#nomsPopped'" data-toggle="collapse">Show popped nominations</a> ({{nomsPopped ? nomsPopped.length : '0'}})</p>
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
                                                <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion'" target="_blank">{{pop.metadata}}</a></td>
                                                <td scope="row">{{pop.content.slice(0, pop.content.indexOf('.')+1) || pop.content}}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p class="text-shadow"><a :href="dqs && '#dqs'" data-toggle="collapse">Show disqualifications done by user</a> ({{dqs ? dqs.length : '0'}})</p>
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
                                                <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion'" target="_blank">{{dq.metadata}}</a></td>
                                                <td scope="row">{{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p class="text-shadow"><a :href="pops && '#pops'" data-toggle="collapse">Show pops done by user</a> ({{pops ? pops.length : '0'}})</p>
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
                                                <td scope="row"><a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion'" target="_blank">{{pop.metadata}}</a></td>
                                                <td scope="row">{{pop.content.slice(0, pop.content.indexOf('.')+1) || pop.content}}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div v-if="discussRound.consensus">
                                <hr>
                                <p class="text-shadow min-spacing mb-2">Application feedback: <button class="btn btn-sm btn-nat" @click="setFeedback($event);">Generate Feedback PM</button></p>
                                <div class="form-group">
                                    <textarea class="form-control dark-textarea" style="white-space: pre-line;" v-model="feedback"></textarea>
                                </div>
                                <div v-if="discussRound.consensus == 'pass'" class="copy-paste">
                                    <samp class="small">Hello!</samp><br><br>
                                    <span v-if="discussRound.bn.probation.indexOf(discussRound.mode) >= 0">
                                        <samp class="small">Following a positive evaluation of your work as a {{discussRound.mode}} BN, we've decided to conclude your probation period and promote you to a full Beatmap Nominator. Congratulations!</samp><br><br>
                                        <samp class="small">You may now nominate maps that are nominated by other probation BNs, and you may disqualify maps when applicable.</samp><br><br>
                                    </span>
                                    <span v-else>
                                        <samp class="small">After evaluating the work of you (and many other BNs), we'd just like to let you know that you're doing well. Thanks!</samp><br><br>
                                    </span>
                                    <samp class="small">Additional feedback from the NAT:</samp><br><br>
                                    <samp class="small">[notice]{{discussRound.feedback}}[/notice]</samp><br><br>
                                    <samp class="small">We hope you have fun as a Beatmap Nominator!</samp>
                                </div>
                                <div v-else-if="discussRound.consensus == 'extend'" class="copy-paste">
                                    <samp class="small">Hello!</samp><br><br>
                                    <span v-if="discussRound.bn.probation.indexOf(discussRound.mode) >= 0">
                                        <samp class="small">After reviewing your activity, proficiency and behaviour in our recent {{discussRound.mode}} BN evaluations, we have decided to [b]extend your probation period[/b].</samp><br><br>
                                        <samp class="small">We will evaluate you again in [b]one month[/b] to determine if the mentioned issues have been overcome. Assuming this is the case, you will be promoted to full Nominator status. Should these issues persist without substantial improvement however, you will be removed from the Beatmap Nominators.</samp><br><br>
                                    </span>
                                    <span v-else>
                                        <samp class="small">After reviewing your activity, proficiency and behaviour in our recent {{discussRound.mode}} BN evaluations, we have decided to [b]place you on probation[/b]. After one month, we will re-evaluate your work as a BN to determine if your probation should be lifted or if you should be removed from the Beatmap Nominators.</samp><br><br>
                                    </span>
                                    <samp class="small">If you have any questions regarding this decision, please do not hesitate to ask any member of the NAT at your earliest convenience.</samp><br><br>
                                    <samp class="small">Additional feedback from the NAT:</samp><br><br>
                                    <samp class="small">[notice]{{discussRound.feedback}}[/notice]</samp><br><br>
                                    <samp class="small">We hope to see you off of probation soon!</samp>
                                </div>
                                <div v-else class="copy-paste">
                                    <samp class="small">Hello!</samp><br><br>
                                    <samp class="small">After reviewing your activity, proficiency and behaviour in our recent {{discussRound.mode}} BN evaluations, we have decided to [b]remove you from the Beatmap Nominators[/b].</samp><br><br>
                                    <samp class="small">Despite this decision, we would like to thank you for your service to the mapping and modding communities and wish you the best of luck in your future endeavours. Should you wish to apply for the Beatmap Nominators in the future, you may do so after 90 days, provided you meet the normal required activity requirements and have shown improvement in the areas mentioned.</samp><br><br>
                                    <samp class="small">If you have any questions regarding this decision, please do not hesitate to ask any member of the NAT at your earliest convenience.</samp><br><br>
                                    <samp class="small">Additional feedback from the NAT:</samp><br><br>
                                    <samp class="small">[notice]{{discussRound.feedback}}[/notice]</samp><br><br>
                                    <samp class="small">Good luck!</samp>
                                </div>
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
                        
                        <div v-if="discussApp" class="col-sm-12 row text-shadow">
                            <div class="col-sm-12 row text-shadow" v-for="evaluation in discussApp.evaluations" :key="evaluation.id">
                                <div :class="evaluation.evaluator.username.length > 10 ? 'col-sm-3' : 'col-sm-2'">
                                    <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-neutral' : 'vote-fail'">{{evaluation.evaluator.username}}</p> 
                                </div>
                                <div class="small" :class="evaluation.evaluator.username.length > 10 ? 'col-sm-9' : 'col-sm-10'">
                                    <p class="mb-1">Behavior: {{evaluation.behaviorComment}}</p> 
                                    <p>Modding: {{evaluation.moddingComment}}</p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="col-sm-12 row text-shadow">
                            <div class="col-sm-12 row text-shadow" v-for="evaluation in discussRound.evaluations" :key="evaluation.id">
                                <div :class="evaluation.evaluator.username.length > 10 ? 'col-sm-3' : 'col-sm-2'">
                                    <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-extend' : 'vote-fail'">{{evaluation.evaluator.username}}</p> 
                                </div>
                                <div class="small" :class="evaluation.evaluator.username.length > 10 ? 'col-sm-9' : 'col-sm-10'">
                                    <p class="mb-1">Behavior: {{evaluation.behaviorComment}}</p> 
                                    <p>Modding: {{evaluation.moddingComment}}</p>
                                </div>
                            </div>
                        </div>

                        <div class="col-sm-12 text-shadow" v-if="readOnly">
                            <hr>
                            <p>Forum PM Feedback:</p>
                            <small class="ml-4">{{discussApp ? discussApp.feedback : discussRound.feedback}}</small>
                        </div>

                        <div class="col-sm-12" v-if="!readOnly">
                            <hr>
                        </div>
                        <div class="col-sm-6" v-if="!readOnly">
                            <p class="text-shadow">Behavior/attitude comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" id="behaviorComments" rows="4" v-model="behaviorComment"></textarea>
                            </div>
                        </div>
                        <div class="col-sm-6" v-if="!readOnly">
                            <p class="text-shadow">Modding comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" id="moddingComments" rows="4" v-model="moddingComment"></textarea>
                            </div>
                        </div>
                        <div class="col-sm-12 mb-2" v-if="!readOnly">
                            <span class="mr-3 text-shadow">Vote:</span>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="1d" value="1" :checked="vote == 1">
                                <label class="form-check-label text-shadow vote-pass" for="1d">Pass</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="2d" value="2" :checked="vote == 2">
                                <label v-if="discussApp" class="form-check-label text-shadow vote-neutral" for="2d">Neutral</label>
                                <label v-else class="form-check-label text-shadow vote-extend" for="2d">Extend</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="vote" id="3d" value="3" :checked="vote == 3">
                                <label class="form-check-label text-shadow vote-fail" for="3d">Fail</label>
                            </div>
                        </div>
                    </div>
                    <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">{{info}} {{confirm}}</div>
                </div>
            </div>
            <div v-if="!readOnly" class="modal-footer" style="overflow: hidden;">
                <button class="btn btn-sm btn-nat" @click="submitEval($event)">{{evaluationId ? 'Update Evaluation' : 'Submit Evaluation'}}</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from "../../mixins/postData.js";

export default {
    name: 'discuss-info',
    props: [ 'discuss-app', 'discuss-round', 'evaluator', 'reports', 'read-only' ],
    mixins: [ postData ],
    computed: {
        
    },
    watch: {
        discussApp: function() {
            if(!this.readOnly){
                this.info = '';
                this.confirm = '';
                this.feedback = this.discussApp.feedback;
                this.findRelevantEval();
            }
        },
        discussRound: function() {
            if(!this.readOnly){
                this.info = '';
                this.confirm = '';
                this.feedback = this.discussRound.feedback;
                this.findRelevantEval();
                if(this.reports && this.reports.length) this.findRelevantReports();
                this.findRelevantActivity();
            }
        },
    },
    methods: {
        //display
        findRelevantEval: function(){
            this.evaluationId = null;
            this.behaviorComment = '';
            this.moddingComment = '';
            this.vote = 0;
            $("input[name=vote]").prop("checked",false);
            
            if(this.discussApp){
                this.discussApp.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator){
                        this.evaluationId = ev.id;
                        this.behaviorComment = ev.behaviorComment;
                        this.moddingComment = ev.moddingComment;
                        this.vote = ev.vote;
                    }
                }); 
            }else{
                this.discussRound.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator){
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
                report.culprit == this.discussRound.bn.id);
        },
        findRelevantActivity: function() {
            axios
                .get('/bnEval/userActivity/' + this.discussRound.bn.osuId + '/' + this.discussRound.mode)
                .then(response => {
                    this.noms = response.data.noms;
                    this.nomsDqd = response.data.nomsDqd;
                    this.nomsPopped = response.data.nomsPopped;
                    this.dqs = response.data.dqs;
                    this.pops = response.data.pops;
                });
        },
        createDeadline: function(date){
            date = new Date(date);
            date = new Date(date.setDate (date.getDate() + 7)).toString().slice(4,10);
            return date;
        },
        modUrl: function(mod){
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && mod.indexOf("#") < 0) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.discussApp.applicant.osuId}`;
            }else{
                return mod;
            }
        },

        //action
        submitEval: async function (e) {
            const vote = $('input[name=vote]:checked').val();
            if(!vote || !this.behaviorComment.length || !this.moddingComment.length){
                this.info = 'Cannot leave fields blank!'
            }else{
                if(this.discussApp){
                    const a = await this.executePost(
                        '/appEval/submitEval/' + this.discussApp.id, 
                        { evaluationId: this.evaluationId, 
                        vote: vote, 
                        behaviorComment: this.behaviorComment, 
                        moddingComment: this.moddingComment,
                        discussion: true
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
                        '/bnEval/submitEval/' + this.discussRound.id, 
                        { evaluationId: this.evaluationId, 
                        vote: vote, 
                        behaviorComment: this.behaviorComment, 
                        moddingComment: this.moddingComment,
                        discussion: true
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
        setConsensus: async function(consensus, e){
            if(this.discussApp){
                const a = await this.executePost(
                    '/appEval/setConsensus/' + this.discussApp.id, {consensus: consensus}, e);
                if (a) {
                    if (a.error) {
                        this.info = a.error;
                    } else {
                        await this.$emit('update-application', a);
                    }
                }
            }else{
                const er = await this.executePost(
                    '/bnEval/setConsensus/' + this.discussRound.id, {consensus: consensus}, e);
                if (er) {
                    if (er.error) {
                        this.info = er.error;
                    } else {
                        await this.$emit('update-eval-round', er);
                    }
                }
            }
        },
        setFeedback: async function(e){
            if(this.discussApp){
                const a = await this.executePost(
                    '/appEval/setFeedback/' + this.discussApp.id, {feedback: this.feedback}, e);
                if (a) {
                    if (a.error) {
                        this.info = a.error;
                    } else {
                        await this.$emit('update-application', a);
                    }
                }
            }else{
                const er = await this.executePost(
                    '/bnEval/setFeedback/' + this.discussRound.id, {feedback: this.feedback}, e);
                if (er) {
                    if (er.error) {
                        this.info = er.error;
                    } else {
                        await this.$emit('update-eval-round', er);
                    }
                }
            }
        }
    },
    data() {
        return {
            evaluationId: '',
            behaviorComment: '',
            moddingComment: '',
            vote: 0,
            feedback: '',
            relevantReports: [],
            info: '',
            confirm: '',
            noms: null,
            pops: null,
            dqs: null,
            nomsPopped: null,
            nomsDqd: null
        };
    },
}
</script>

<style>


</style>