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
                        <div v-if="discussApp" class="col-sm-12">
                            <p class="text-shadow">Submitted mods:</p>
                            <ul style="list-style-type: disc;">
                                <li class="small text-shadow" v-for="(mod, i) in discussApp.mods" :key="i">
                                    <a :href="modUrl(mod)" target="_blank">{{modUrl(mod)}}</a>
                                </li>
                                <li class="small text-shadow"><a :href="'https://osu.ppy.sh/users/' + discussApp.applicant.osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a></li>
                            </ul>
                            <p class="text-shadow">Test results: 
                                <a href="http://bn.mappersguild.com/testresults" target="_blank" 
                                :class="discussApp.test.totalScore > 15 ? 'vote-pass' : discussApp.test.totalScore > 12.5 ? 'vote-extend' : 'vote-fail'">
                                    {{discussApp.test.totalScore || discussApp.test.totalScore >= 0 ? discussApp.test.totalScore + '/20' : 'incomplete'}}
                                </a>
                            </p>
                            <h5 class="text-shadow mb-2" v-if="!readOnly">Consensus:
                                <span v-if="discussApp.consensus" :class="'vote-' + discussApp.consensus">{{discussApp.consensus}}</span>
                                <span v-else>none</span>
                                <span v-if="evaluator.isLeader">
                                    <button
                                        class="btn btn-sm btn-nat-green"
                                        :disabled="discussApp.consensus == 'pass' "
                                        @click="setConsensus('pass', $event);"
                                    >Set Pass</button>
                                    <button
                                        class="btn btn-sm btn-nat-red"
                                        :disabled="discussApp.consensus == 'fail'"
                                        @click="setConsensus('fail', $event);"
                                    >Set Fail</button>
                                </span>
                            </h5>
                            <div v-if="discussApp.consensus && !readOnly">
                                <hr>
                                <p class="text-shadow min-spacing mb-2">
                                    Application feedback: <button class="btn btn-sm btn-nat" @click="setFeedback($event);">Generate Feedback PM</button>
                                    <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#forumPmBox">
                                        See full message <i class="fas fa-angle-down"></i>
                                    </button>
                                </p>
                                <div class="form-group">
                                    <textarea class="form-control dark-textarea" style="white-space: pre-line;" v-model="feedback"></textarea>
                                </div>
                                <feedback-pm
                                    :discuss-app="discussApp">
                                </feedback-pm>
                            </div>
                            <hr>
                        </div>
                        <div v-else-if="!readOnly" class="col-sm-12">
                            <user-activity
                                :eval-round="discussRound">
                            </user-activity>

                            <h5 v-if="discussRound" class="text-shadow mb-3 ml-1 mt-1">Consensus:
                                <span v-if="discussRound.consensus" :class="'vote-' + discussRound.consensus">{{discussRound.consensus}}</span>
                                <span v-else>none</span>
                                <span v-if="!readOnly && evaluator.isLeader">
                                <button
                                    class="btn btn-sm btn-nat-green"
                                    :disabled="discussRound.consensus == 'pass' "
                                    @click="setConsensus('pass', $event);"
                                >Set Pass</button>
                                <button
                                    class="btn btn-sm btn-nat-yellow"
                                    :disabled="discussRound.consensus == 'extend' "
                                    @click="setConsensus('extend', $event);"
                                >Set Extend</button>
                                <button
                                    class="btn btn-sm btn-nat-red"
                                    :disabled="discussRound.consensus == 'fail'"
                                    @click="setConsensus('fail', $event);"
                                >Set Fail</button>
                                </span>
                            </h5>

                            <div v-if="discussRound.consensus">
                                <hr>
                                <p class="text-shadow min-spacing mb-2">Application feedback: 
                                    <button class="btn btn-sm btn-nat" @click="setFeedback($event);">Generate Feedback PM</button>
                                    <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#currentBnForumPmBox">
                                        See full message <i class="fas fa-angle-down"></i>
                                    </button>
                                </p>
                                <div class="form-group">
                                    <textarea class="form-control dark-textarea" style="white-space: pre-line;" v-model="feedback"></textarea>
                                </div>
                                <feedback-pm
                                    :discuss-round="discussRound">
                                </feedback-pm>
                            </div>
                            
                            <div v-if="relevantReports.length">
                                <hr>
                                <p class="text-shadow">Reports:</p>
                                <div v-for="report in relevantReports" :key="report.id">
                                    <p class="text-shadow pl-2">
                                        <pre class="pre-font small" :class="report.valid == 1 ? 'vote-pass' : 'vote-extend'">{{report.createdAt.slice(0,10)}}: {{report.simplifiedReason || report.reason}}</pre>
                                    </p>
                                </div>
                            </div>
                            <hr> 
                        </div>
                        
                        <div v-if="discussApp" class="col-sm-12 row text-shadow">
                            <div class="col-sm-12 row text-shadow" v-for="evaluation in discussApp.evaluations" :key="evaluation.id">
                                <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-3' : 'col-sm-2'">
                                    <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-neutral' : 'vote-fail'">{{evaluation.evaluator.username}}</p> 
                                </div>
                                <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-9' : 'col-sm-10'">
                                    <p class="mb-1">Behavior: <pre class="secondary-text pre-font small">{{evaluation.behaviorComment}}</pre></p> 
                                    <p>Modding: <pre class="secondary-text pre-font small">{{evaluation.moddingComment}}</pre></p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="col-sm-12 row text-shadow">
                            <div class="col-sm-12 row text-shadow" v-for="evaluation in discussRound.evaluations" :key="evaluation.id">
                                <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-3' : 'col-sm-2'">
                                    <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-extend' : 'vote-fail'">{{evaluation.evaluator.username}}</p> 
                                </div>
                                <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-9' : 'col-sm-10'">
                                    <p class="mb-1">Behavior: <pre class="secondary-text pre-font small">{{evaluation.behaviorComment}}</pre></p> 
                                    <p>Modding: <pre class="secondary-text pre-font small">{{evaluation.moddingComment}}</pre></p>
                                </div>
                            </div>
                        </div>

                        <div class="col-sm-12 text-shadow" v-if="readOnly">
                            <hr>
                            <p v-if="discussApp">Forum PM Feedback: 
                                <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#forumPmBox">
                                    See full message <i class="fas fa-angle-down"></i>
                                </button>
                                <feedback-pm
                                    :discuss-app="discussApp">
                                </feedback-pm>
                            </p>
                            <p v-else>Forum PM Feedback: 
                                <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#currentBnForumPmBox">
                                    See full message <i class="fas fa-angle-down"></i>
                                </button>
                                <feedback-pm
                                    :discuss-round="discussRound">
                                </feedback-pm>
                            </p>
                            
                        </div>

                        <div class="col-sm-12" v-if="!readOnly">
                            <hr>
                        </div>
                        <div class="col-sm-6" v-if="!readOnly">
                            <p class="text-shadow">Behavior/attitude comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" style="white-space: pre-line;" id="behaviorComments" rows="4" v-model="behaviorComment"></textarea>
                            </div>
                        </div>
                        <div class="col-sm-6" v-if="!readOnly">
                            <p class="text-shadow">Modding comments:</p>
                            <div class="form-group">
                                <textarea class="form-control dark-textarea" style="white-space: pre-line;" id="moddingComments" rows="4" v-model="moddingComment"></textarea>
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
import UserActivity from './UserActivity.vue'
import FeedbackPm from './FeedbackPm.vue'

export default {
    name: 'discuss-info',
    props: [ 'discuss-app', 'discuss-round', 'evaluator', 'reports', 'read-only' ],
    mixins: [ postData ],
    components: {
        UserActivity,
        FeedbackPm
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
                    if(ev.evaluator.id == this.evaluator.id){
                        this.evaluationId = ev.id;
                        this.behaviorComment = ev.behaviorComment;
                        this.moddingComment = ev.moddingComment;
                        this.vote = ev.vote;
                    }
                }); 
            }else{
                this.discussRound.evaluations.forEach(ev => {
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
                report.culprit == this.discussRound.bn.id && report.display);
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
            }else if(this.evaluator.isSpectator){
                this.info = "You're not allowed to do that"
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
            if(!this.evaluator.isSpectator){
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
            }
        },
        setFeedback: async function(e){
            if(!this.evaluator.isSpectator){
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