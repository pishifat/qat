<template>
    <div id="evaluationInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="application || evalRound" class="modal-content custom-bg-dark">
                <div class="modal-header text-dark" :class="(application && (application.isPriority || isNatEvaluator())) || (evalRound && evalRound.isPriority) ? 'bg-priority' : 'bg-nat-logo'">
                    <h5 v-if="application" class="modal-title">
                        Application Evaluation: <a :href="'https://osu.ppy.sh/users/' + application.applicant.osuId" class="text-dark" target="_blank" @click.stop>{{ application.applicant.username }}</a>
                        <i v-if="application.mode == 'osu'" class="far fa-circle" />
                        <i v-else-if="application.mode == 'taiko'" class="fas fa-drum" />
                        <i v-else-if="application.mode == 'catch'" class="fas fa-apple-alt" />
                        <i v-else-if="application.mode == 'mania'" class="fas fa-stream" />
                    </h5>
                    <h5 v-else class="modal-title">
                        BN Evaluation: <a :href="'https://osu.ppy.sh/users/' + evalRound.bn.osuId" class="text-dark" target="_blank" @click.stop>{{ evalRound.bn.username }}</a>
                        <i v-if="evalRound.mode == 'osu'" class="far fa-circle" />
                        <i v-else-if="evalRound.mode == 'taiko'" class="fas fa-drum" />
                        <i v-else-if="evalRound.mode == 'catch'" class="fas fa-apple-alt" />
                        <i v-else-if="evalRound.mode == 'mania'" class="fas fa-stream" />
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <div class="row">
                            <div v-if="application" class="col-sm-12">
                                <p class="text-shadow min-spacing">
                                    Modding:
                                </p>
                                <ul style="list-style-type: disc;">
                                    <li v-for="(mod, i) in application.mods" :key="i" class="small text-shadow">
                                        <a :href="modUrl(mod)" target="_blank">{{ modUrl(mod) }}</a>
                                    </li>
                                    <li class="small text-shadow">
                                        <a :href="'https://osu.ppy.sh/users/' + application.applicant.osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a>
                                    </li>
                                </ul>
                                <div v-if="evaluator.isNat" class="row">
                                    <p class="text-shadow col-sm-12">
                                        Test results: 
                                        <a
                                            :href="`http://bn.mappersguild.com/testresults?user=${application.applicant.osuId}`"
                                            target="_blank" 
                                            :class="testPoints > 15 ? 'vote-pass' : testPoints > 12.5 ? 'vote-extend' : 'vote-fail'"
                                        >
                                            {{ testPoints + '/20' }}
                                        </a>
                                    </p>
                                    <p class="col-md-12 text-shadow">
                                        <a href="#additionalInfo" data-toggle="collapse">Additional Info <i class="fas fa-angle-down" /></a>
                                        <a
                                            href="#"
                                            class="float-right small vote-pass ml-2"
                                            data-toggle="tooltip"
                                            data-placement="top"
                                            :title="application.isPriority ? 'mark evaluation as low priority' : 'mark evaluation as high priority'"
                                            @click.prevent.stop="toggleIsPriority()"
                                        >
                                            <i class="fas" :class="application.isPriority ? 'fa-arrow-down' : 'fa-arrow-up'" />
                                        </a>
                                    </p>
                                    <div id="additionalInfo" class="collapse row col-sm-12 mx-2 pt-1">
                                        <p v-if="application.test.comment && application.test.comment.length" class="text-shadow col-sm-12">
                                            Applicant comment: <span class="small">{{ application.test.comment }}</span>
                                        </p>
                                        <div class="col-sm-12">
                                            <p class="min-spacing text-shadow">
                                                Previous evaluations:
                                            </p>
                                            <ul v-if="previousEvaluations">
                                                <li v-if="!previousEvaluations.length" class="small min-spacing text-shadow">User has no previous evaluations</li>
                                                <li v-else v-for="evaluation in previousEvaluations" :key="evaluation.id" class="small text-shadow">
                                                    <a :href="'http://bn.mappersguild.com/evalarchive?eval=' + evaluation.id">{{ evaluation.updatedAt.slice(0,10) }} - {{evaluation.applicant ? "APPLICATION" : "BN EVAL"}}</a> - <span :class="'vote-' + evaluation.consensus">{{ evaluation.consensus.toUpperCase() }}</span>
                                                    <pre class="secondary-text pre-font ml-2" v-html="filterLinks(evaluation.feedback)"></pre>
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
                                        <div :class="application.bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
                                            <p class="text-shadow min-spacing">
                                                Assigned NAT: 
                                            </p>
                                            <ul>
                                                <li v-for="user in application.natEvaluators" :key="user.id" class="small text-shadow">
                                                    {{ user.username }}
                                                </li>
                                            </ul>
                                        </div>
                                        <div v-if="application.bnEvaluators.length && evaluator.isLeader" class="col-sm-4">
                                            <p class="text-shadow min-spacing">
                                                Assigned BN: ({{ application.bnEvaluators.length }}):
                                            </p>
                                            <ul>
                                                <li v-for="user in application.bnEvaluators" :key="user.id" class="small text-shadow">
                                                    {{ user.username }}
                                                </li>
                                            </ul>
                                        </div>
                                        <div :class="application.bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
                                            <p class="text-shadow min-spacing">
                                                Total Evaluations: {{ application.evaluations.length }}
                                            </p>
                                            <ul>
                                                <li v-for="evaluation in application.evaluations" :key="evaluation.id" class="small text-shadow">
                                                    {{ evaluation.evaluator.username }}
                                                </li>
                                            </ul>
                                        </div>
                                        <div v-if="evaluator.isLeader && !application.bnEvaluators.length" class="col-sm-12">
                                            <button class="btn btn-sm btn-nat mb-2" @click="selectBnEvaluators($event)">
                                                {{ tempBnEvaluators ? 'Re-select BN Evaluators' : 'Select BN Evaluators' }}
                                            </button> 
                                            <button v-if="tempBnEvaluators" class="btn btn-sm btn-nat-red mb-2" @click="enableBnEvaluators($event)">
                                                Enable BN Evaluations
                                            </button>
                                            <div v-if="tempBnEvaluators" class="text-shadow">
                                                <p>Users:</p>
                                                <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                                                    <ul style="list-style-type: none; padding: 0">
                                                        <li v-for="user in tempBnEvaluators" :key="user.id">
                                                            <samp class="small">{{ user.username }}</samp>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <p>Forum message:</p>
                                                <div id="forumMessage" class="copy-paste">
                                                    <samp class="small">Hello!</samp><br><br>
                                                    <samp class="small">You have been selected to help evaluate the [i]{{ application.mode == 'osu' ? 'osu!' : 'osu!' + application.mode }}[/i] mode BN application for [url=https://osu.ppy.sh/users/{{ application.applicant.osuId }}]{{ application.applicant.username }}[/url].</samp><br><br>
                                                    <samp class="small">Please post your thoughts on the applicant's behavior and modding quality (based on submitted mods and anything else you may know) on the [url=http://bn.mappersguild.com/appeval]BN/NAT website[/url].</samp><br><br>
                                                    <samp class="small">If the user's application is not visible, that means it has received enough evaluations for a consensus to be reached -- this usually [b]3-5 days[/b] after you receive this message. Your decision will be anonymous to everyone but members of the NAT.</samp><br><br>
                                                    <samp class="small">Keep in mind that this is a 100% optional activity. If you do not want to participate in BN application evaluations, opt-out from your card on the [url=http://bn.mappersguild.com/users]users page[/url]. Failing to finish on time has no penalty.</samp><br><br>
                                                    <samp class="small">Thank you for your hard work!</samp><br><br>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                            </div>

                            <div v-if="evalRound" class="col-sm-12">
                                <user-activity
                                    :eval-round="evalRound"
                                />
                                <hr>
                            </div>
                        
                        
                            <div class="col-sm-6">
                                <p class="text-shadow">
                                    Behavior/attitude comments:
                                </p>
                                <div class="form-group">
                                    <textarea
                                        id="behaviorComments"
                                        v-model="behaviorComment"
                                        class="form-control dark-textarea"
                                        style="white-space: pre-line;"
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <p class="text-shadow">
                                    Modding comments:
                                </p>
                                <div class="form-group">
                                    <textarea
                                        id="moddingComments"
                                        v-model="moddingComment"
                                        class="form-control dark-textarea"
                                        style="white-space: pre-line;"
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div class="col-sm-12 mb-2">
                                <span class="mr-3 text-shadow">Vote:</span>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="1"
                                        v-model="vote"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="1"
                                    >
                                    <label class="form-check-label text-shadow vote-pass" for="1">Pass</label>
                                </div>
                                <div v-if="application" class="form-check form-check-inline">
                                    <input
                                        id="2"
                                        v-model="vote"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="2"
                                    >
                                    <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                                </div>
                                <div v-else class="form-check form-check-inline">
                                    <input
                                        id="2"
                                        v-model="vote"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="2"
                                    >
                                    <label class="form-check-label text-shadow vote-extend" for="2">Extend</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="3"
                                        v-model="vote"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="3"
                                    >
                                    <label class="form-check-label text-shadow vote-fail" for="3">Fail</label>
                                </div>
                            </div>
                        </div>
                        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                            {{ info }} {{ confirm }}
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="overflow: hidden;">
                    <button class="btn btn-sm btn-nat" @click="submitEval($event)">
                        {{ evaluationId ? 'Update Evaluation' : 'Submit Evaluation' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import UserActivity from './UserActivity.vue';

export default {
    name: 'EvalInfo',
    components: {
        UserActivity,
    },
    mixins: [ postData, filterLinks ],
    props: [ 'application', 'evalRound', 'evaluator' ],
    data() {
        return {
            evaluationId: '',
            behaviorComment: '',
            moddingComment: '',
            previousEvaluations: null,
            userNotes: null,
            vote: 0,
            info: '',
            confirm: '',
            tempBnEvaluators: null,
        };
    },
    computed: {
        testPoints() {
            return this.application.test.totalScore;
        }
    },
    watch: {
        application() {
            this.info = '';
            this.confirm = '';
            this.tempBnEvaluators = null;
            this.findRelevantEval();
            this.previousEvaluations = null;
            this.userNotes = null;
            this.findPreviousEvaluations();
            this.findUserNotes();
            history.pushState(null, 'BN Application Evaluations', `/appeval?eval=${this.application.id}`);
        },
        evalRound() {
            this.info = '';
            this.confirm = '';
            this.findRelevantEval();
            history.pushState(null, 'BN Application Evaluations', `/bneval?eval=${this.evalRound.id}`);
        },
    },
    methods: {
        //display
        findRelevantEval(){
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
        async findPreviousEvaluations() {
            axios
                .get('/bnEval/findPreviousEvaluations/' + this.application.applicant.id)
                .then(response => {
                    this.previousEvaluations = response.data.previousEvaluations;
                });
        },
        async findUserNotes() {
            axios
                .get('/bnEval/findUserNotes/' + this.application.applicant.id)
                .then(response => {
                    this.userNotes = response.data.userNotes;
                });
        },
        createDeadline(date){
            date = new Date(date);
            date = new Date(date.setDate (date.getDate() + 7)).toString().slice(4,10);
            return date;
        },
        modUrl(mod){
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && (mod.indexOf('#') < 0 || mod.indexOf('#') > 40)) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                if(indexEnd == -1) indexEnd = mod.length;
                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.application.applicant.osuId}`;
            }else{
                return mod;
            }
        },
        isNatEvaluator() {
            for (let i = 0; i < this.application.natEvaluators.length; i++) {
                let user = this.application.natEvaluators[i];
                if(user.id == this.evaluator.id){
                    return true;
                }
            }
            return false;
        },

        //action
        async submitEval (e) {
            if(!this.vote || !this.behaviorComment.length || !this.moddingComment.length){
                this.info = 'Cannot leave fields blank!';
            }else{
                if(this.application){
                    const a = await this.executePost(
                        '/appEval/submitEval/' + this.application.id, 
                        { evaluationId: this.evaluationId, 
                            vote: this.vote, 
                            behaviorComment: this.behaviorComment, 
                            moddingComment: this.moddingComment,
                        }, e);
                    
                    if (a) {
                        if (a.error) {
                            this.info = a.error;
                        } else {
                            await this.$emit('update-application', a);
                            if(this.evaluationId){
                                this.confirm = 'Evaluation updated!';
                            }else{
                                this.confirm = 'Evaluation submitted!';
                            }
                        }
                    }
                }else{
                    const er = await this.executePost(
                        '/bnEval/submitEval/' + this.evalRound.id, 
                        { evaluationId: this.evaluationId, 
                            vote: this.vote, 
                            behaviorComment: this.behaviorComment, 
                            moddingComment: this.moddingComment,
                        }, e);
                    if (er) {
                        if (er.error) {
                            this.info = er.error;
                        } else {
                            await this.$emit('update-eval-round', er);
                            if(this.evaluationId){
                                this.confirm = 'Evaluation updated!';
                            }else{
                                this.confirm = 'Evaluation submitted!';
                            }
                        }
                    }
                }
                
            }
        },
        async toggleIsPriority() {
            if (this.application){
                const a = await this.executePost(
                    '/appEval/toggleIsPriority/' + this.application.id, { isPriority: this.application.isPriority });
                if (a) {
                    if (a.error) {
                        this.info = a.error;
                    } else {
                        await this.$emit('update-application', a);
                    }
                } 
            }else{
                const er = await this.executePost(
                    '/bnEval/toggleIsPriority/' + this.evalRound.id, { isPriority: this.evalRound.isPriority });
                if (er) {
                    if (er.error) {
                        this.info = er.error;
                    } else {
                        await this.$emit('update-eval-round', er);
                    }
                } 
            }
        },
        async selectBnEvaluators(e) {
            const r = await this.executePost('/appeval/selectBnEvaluators', { mode: this.application.mode, id: this.application.id }, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.tempBnEvaluators = r;
                }
            }
        },
        async enableBnEvaluators (e) {
            const a = await this.executePost('/appEval/enableBnEvaluators/' + this.application.id, { bnEvaluators: this.tempBnEvaluators }, e);
            if (a) {
                if (a.error) {
                    this.info = a.error;
                } else {
                    await this.$emit('update-application', a);
                    this.confirm = 'Evaluations by selected BNs have been enabled!';
                }
            }
        },
    },
};
</script>

<style>

</style>