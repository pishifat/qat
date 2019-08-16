<template>
    <div id="discussionInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="discussApp || discussRound" class="modal-content custom-bg-dark">
                <div class="modal-header text-dark" :class="(discussApp && discussApp.isPriority) || (discussRound && discussRound.isPriority) ? 'bg-priority' : 'bg-nat-logo'">
                    <h5 v-if="discussApp" class="modal-title">
                        Application Evaluation: <a :href="'https://osu.ppy.sh/users/' + discussApp.applicant.osuId" class="text-dark" target="_blank" @click.stop>{{ discussApp.applicant.username }}</a>
                        <i v-if="discussApp.mode == 'osu'" class="far fa-circle" />
                        <i v-else-if="discussApp.mode == 'taiko'" class="fas fa-drum" />
                        <i v-else-if="discussApp.mode == 'catch'" class="fas fa-apple-alt" />
                        <i v-else-if="discussApp.mode == 'mania'" class="fas fa-stream" />
                    </h5>
                    <h5 v-else class="modal-title">
                        BN Evaluation: <a :href="'https://osu.ppy.sh/users/' + discussRound.bn.osuId" class="text-dark" target="_blank" @click.stop>{{ discussRound.bn.username }}</a>
                        <i v-if="discussRound.mode == 'osu'" class="far fa-circle" />
                        <i v-else-if="discussRound.mode == 'taiko'" class="fas fa-drum" />
                        <i v-else-if="discussRound.mode == 'catch'" class="fas fa-apple-alt" />
                        <i v-else-if="discussRound.mode == 'mania'" class="fas fa-stream" />
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <div class="row">
                            <div v-if="discussApp" class="col-sm-12">
                                <p class="text-shadow">
                                    Submitted mods:
                                </p>
                                <ul style="list-style-type: disc;">
                                    <li v-for="(mod, i) in discussApp.mods" :key="i" class="small text-shadow">
                                        <a :href="modUrl(mod)" target="_blank">{{ modUrl(mod) }}</a>
                                    </li>
                                    <li class="small text-shadow">
                                        <a :href="'https://osu.ppy.sh/users/' + discussApp.applicant.osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a>
                                    </li>
                                </ul>
                                <p class="text-shadow">
                                    Test results: 
                                    <a
                                        :href="`http://bn.mappersguild.com/testresults?user=${discussApp.applicant.osuId}`"
                                        target="_blank" 
                                        :class="discussApp.test.totalScore > 15 ? 'vote-pass' : discussApp.test.totalScore > 12.5 ? 'vote-extend' : 'vote-fail'"
                                    >
                                        {{ discussApp.test.totalScore || discussApp.test.totalScore >= 0 ? discussApp.test.totalScore + '/20' : 'incomplete' }}
                                    </a>
                                </p>
                                <h5 v-if="!readOnly" class="text-shadow mb-2">
                                    Consensus:
                                    <span v-if="discussApp.consensus" :class="'vote-' + discussApp.consensus">{{ discussApp.consensus }}</span>
                                    <span v-else>none</span>
                                    <button
                                        class="btn btn-sm btn-nat-green"
                                        :disabled="discussApp.consensus == 'pass' "
                                        @click="setConsensus('pass', $event);"
                                    >
                                        Set Pass
                                    </button>
                                    <button
                                        class="btn btn-sm btn-nat-red"
                                        :disabled="discussApp.consensus == 'fail'"
                                        @click="setConsensus('fail', $event);"
                                    >
                                        Set Fail
                                    </button>
                                    <a 
                                        href="#"
                                        class="float-right small vote-pass ml-2"
                                        data-toggle="tooltip"
                                        data-placement="top" 
                                        :title="discussApp.isPriority ? 'mark evaluation as low priority' : 'mark evaluation as high priority'"
                                        @click.prevent.stop="toggleIsPriority()"
                                    >
                                        <i class="fas" :class="discussApp.isPriority ? 'fa-arrow-down' : 'fa-arrow-up'" />
                                    </a>
                                </h5>
                                <div v-if="discussApp.consensus && !readOnly">
                                    <hr>
                                    <p class="text-shadow min-spacing mb-2">
                                        Application feedback: 
                                    </p>
                                    <div class="form-group">
                                        <textarea v-model="feedback" class="form-control dark-textarea" style="white-space: pre-line;" />
                                    </div>
                                    <div v-if="discussApp.consensus == 'pass'" class="input-group mb-3">
                                        <input v-model="discordLink" class="form-control" type="text" placeholder="discord invite link...">
                                    </div>
                                    <div>
                                        <button class="btn btn-sm btn-nat" data-toggle="collapse" data-target="#forumPmBox">
                                            See full message <i class="fas fa-angle-down" />
                                        </button>
                                        <button class="btn btn-sm btn-nat float-right" @click="setFeedback($event)">
                                            Save
                                        </button>
                                    </div>
                                    <feedback-pm
                                        :discuss-app="discussApp"
                                        :discord-link="discordLink"
                                        :feedback="feedback"
                                    />
                                </div>
                                <hr>
                            </div>
                            <div v-else class="col-sm-12">
                                <user-activity
                                    :eval-round="discussRound"
                                />
                                <h5 v-if="discussRound" class="text-shadow mb-3 ml-1 mt-1">
                                    Consensus:
                                    <span v-if="discussRound.consensus" :class="'vote-' + discussRound.consensus">{{ discussRound.consensus }}</span>
                                    <span v-else>none</span>
                                    <span v-if="!readOnly">
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
                                        <a
                                            href="#"
                                            class="float-right small vote-pass ml-2 mt-2"
                                            data-toggle="tooltip"
                                            data-placement="top"
                                            :title="discussRound.isPriority ? 'mark evaluation as low priority' : 'mark evaluation as high priority'"
                                            @click.prevent.stop="toggleIsPriority()"
                                        >
                                            <i class="fas" :class="discussRound.isPriority ? 'fa-arrow-down' : 'fa-arrow-up'" />
                                        </a>
                                    </span>
                                </h5>

                                <div v-if="discussRound.consensus && !readOnly">
                                    <hr>
                                    <p class="text-shadow min-spacing mb-2">
                                        Application feedback: 
                                        <span v-if="discussRound.consensus == 'pass'">
                                            <button v-if="!discussRound.isLowActivity" class="btn btn-sm btn-nat" @click="toggleLowActivity($event);">Use inactivity template</button>
                                            <button v-else class="btn btn-sm btn-nat" @click="toggleLowActivity($event);">Use normal template</button>
                                        </span>
                                    </p>
                                    <div class="form-group">
                                        <textarea v-model="feedback" class="form-control dark-textarea" style="white-space: pre-line;" />
                                    </div>
                                    <div>
                                        <button class="btn btn-sm btn-nat" data-toggle="collapse" data-target="#currentBnForumPmBox">
                                            See full message <i class="fas fa-angle-down" />
                                        </button>
                                        <button class="btn btn-sm btn-nat float-right" @click="setFeedback($event)">
                                            Save
                                        </button>
                                    </div>
                                    <feedback-pm
                                        :discuss-round="discussRound"
                                        :feedback="feedback"
                                    />
                                </div>
                                
                                <div v-if="relevantReports.length">
                                    <hr>
                                    <p class="text-shadow">
                                        Reports:
                                    </p>
                                    <div v-for="report in relevantReports" :key="report.id">
                                        <p class="text-shadow pl-2">
                                            <span class="small">{{ report.createdAt.slice(0,10) }}:</span>
                                            <pre class="pre-font small ml-2" :class="report.valid == 1 ? 'vote-pass' : 'vote-extend'"> <span v-html="filterLinks(report.reason)" /></pre>
                                        </p>
                                    </div>
                                </div>
                                <hr> 
                            </div>
                            
                            <div v-if="discussApp" class="col-sm-12 row text-shadow">
                                <div v-for="evaluation in natEvaluations" :key="evaluation.id" class="col-sm-12 row text-shadow">
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-3' : 'col-sm-2'">
                                        <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-neutral' : 'vote-fail'">
                                            {{ evaluation.evaluator.username }}
                                        </p> 
                                    </div>
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-9' : 'col-sm-10'">
                                        <p class="mb-1">
                                            Behavior: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.behaviorComment)" />
                                        </p> 
                                        <p>Modding: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.moddingComment)" /></p>
                                    </div>
                                </div>
                                <div v-for="evaluation in bnEvaluations" :key="evaluation.id" class="col-sm-12 row text-shadow">
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-3' : 'col-sm-2'">
                                        <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-neutral' : 'vote-fail'">
                                            {{ evaluation.evaluator.username }}
                                        </p> 
                                    </div>
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-9' : 'col-sm-10'">
                                        <p class="mb-1">
                                            Behavior: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.behaviorComment)" />
                                        </p> 
                                        <p>Modding: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.moddingComment)" /></p>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="col-sm-12 row text-shadow">
                                <div v-for="evaluation in discussRound.evaluations" :key="evaluation.id" class="col-sm-12 row text-shadow">
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-3' : 'col-sm-2'">
                                        <p :class=" evaluation.vote == 1 ? 'vote-pass' : evaluation.vote == 2 ? 'vote-extend' : 'vote-fail'">
                                            {{ evaluation.evaluator.username }}
                                        </p> 
                                    </div>
                                    <div :class="evaluation.evaluator.username.length > 12 ? 'col-sm-9' : 'col-sm-10'">
                                        <p class="mb-1">
                                            Behavior: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.behaviorComment)" />
                                        </p> 
                                        <p>Modding: <pre class="secondary-text pre-font small" v-html="filterLinks(evaluation.moddingComment)" /></p>
                                    </div>
                                </div>
                            </div>

                            <div v-if="readOnly" class="col-sm-12 text-shadow">
                                <hr>
                                <p v-if="discussApp">
                                    <button class="btn btn-sm btn-nat" data-toggle="collapse" data-target="#forumPmBox">
                                        See full Forum PM feedback message <i class="fas fa-angle-down" />
                                    </button>
                                    <feedback-pm
                                        :discuss-app="discussApp"
                                        :feedback="feedback"
                                    />
                                </p>
                                <p v-else>
                                    <button class="btn btn-sm btn-nat" data-toggle="collapse" data-target="#currentBnForumPmBox">
                                        See full Forum PM feedback message <i class="fas fa-angle-down" />
                                    </button>
                                    <feedback-pm
                                        :discuss-round="discussRound"
                                        :feedback="feedback"
                                    />
                                </p>
                            </div>

                            <div v-if="!readOnly" class="col-sm-12">
                                <hr>
                            </div>
                            <div v-if="!readOnly" class="col-sm-6">
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
                            <div v-if="!readOnly" class="col-sm-6">
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
                            <div v-if="!readOnly" class="col-sm-12 mb-2">
                                <span class="mr-3 text-shadow">Vote:</span>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="1d"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="1"
                                        :checked="vote == 1"
                                    >
                                    <label class="form-check-label text-shadow vote-pass" for="1d">Pass</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="2d"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="2"
                                        :checked="vote == 2"
                                    >
                                    <label v-if="discussApp" class="form-check-label text-shadow vote-neutral" for="2d">Neutral</label>
                                    <label v-else class="form-check-label text-shadow vote-extend" for="2d">Extend</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="3d"
                                        class="form-check-input"
                                        type="radio"
                                        name="vote"
                                        value="3"
                                        :checked="vote == 3"
                                    >
                                    <label class="form-check-label text-shadow vote-fail" for="3d">Fail</label>
                                </div>
                            </div>
                        </div>
                        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                            {{ info }} {{ confirm }}
                        </div>
                    </div>
                </div>
                <div v-if="!readOnly" class="modal-footer" style="overflow: hidden;">
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
import FeedbackPm from './FeedbackPm.vue';

export default {
    name: 'DiscussInfo',
    components: {
        UserActivity,
        FeedbackPm,
    },
    mixins: [ postData, filterLinks ],
    props: [ 'discussApp', 'discussRound', 'evaluator', 'reports', 'readOnly' ],
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
            nomsDqd: null,
            discordLink: null,
        };
    },
    computed: {
        bnEvaluations() {
            let e = [];
            this.discussApp.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.group == 'bn') e.push(evaluation);
            });
            return e;
        },
        natEvaluations() {
            let e = [];
            this.discussApp.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.group == 'nat') e.push(evaluation);
            });
            return e;
        },
    },
    watch: {
        discussApp() {
            if(!this.readOnly){
                this.info = '';
                this.confirm = '';
                this.findRelevantEval();
            }
            if(this.discussApp) this.feedback = this.discussApp.feedback;
        },
        discussRound() {
            if(!this.readOnly){
                this.info = '';
                this.confirm = '';
                this.findRelevantEval();
                if(this.reports && this.reports.length) this.findRelevantReports();
            }
            if(this.discussRound) this.feedback = this.discussRound.feedback;
        },
    },
    methods: {
        //display
        findRelevantEval(){
            this.evaluationId = null;
            this.behaviorComment = '';
            this.moddingComment = '';
            this.vote = 0;
            $('input[name=vote]').prop('checked',false);
            
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
        findRelevantReports() {
            this.relevantReports = this.reports.filter( report => 
                report.culprit == this.discussRound.bn.id && report.display);
        },
        createDeadline(date){
            date = new Date(date);
            date = new Date(date.setDate (date.getDate() + 7)).toString().slice(4,10);
            return date;
        },
        modUrl(mod){
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && mod.indexOf('#') < 0 || mod.indexOf('#') > 40) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                if(indexEnd == -1) indexEnd = mod.length;
                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.discussApp.applicant.osuId}`;
            }else{
                return mod;
            }
        },

        //action
        async submitEval (e) {
            const vote = $('input[name=vote]:checked').val();
            if(!vote || !this.behaviorComment.length || !this.moddingComment.length){
                this.info = 'Cannot leave fields blank!';
            }else if(this.evaluator.isSpectator){
                this.info = 'You\'re not allowed to do that';
            }else{
                if(this.discussApp){
                    const a = await this.executePost(
                        '/appEval/submitEval/' + this.discussApp.id, 
                        { evaluationId: this.evaluationId, 
                            vote, 
                            behaviorComment: this.behaviorComment, 
                            moddingComment: this.moddingComment,
                            discussion: true,
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
                        '/bnEval/submitEval/' + this.discussRound.id, 
                        { evaluationId: this.evaluationId, 
                            vote, 
                            behaviorComment: this.behaviorComment, 
                            moddingComment: this.moddingComment,
                            discussion: true,
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
        async setConsensus(consensus, e){
            if(!this.evaluator.isSpectator){
                if(this.discussApp){
                    const a = await this.executePost(
                        '/appEval/setConsensus/' + this.discussApp.id, { consensus }, e);
                    if (a) {
                        if (a.error) {
                            this.info = a.error;
                        } else {
                            await this.$emit('update-application', a);
                        }
                    }
                }else{
                    const er = await this.executePost(
                        '/bnEval/setConsensus/' + this.discussRound.id, { consensus }, e);
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
        async setFeedback(e){
            if(!this.evaluator.isSpectator){
                if(this.discussApp){
                    const a = await this.executePost(
                        '/appEval/setFeedback/' + this.discussApp.id, { feedback: this.feedback }, e);
                    if (a) {
                        if (a.error) {
                            this.info = a.error;
                        } else {
                            await this.$emit('update-application', a);
                        }
                    }
                }else{
                    const er = await this.executePost(
                        '/bnEval/setFeedback/' + this.discussRound.id, { feedback: this.feedback }, e);
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
        async toggleIsPriority() {
            if (this.discussApp){
                const a = await this.executePost(
                    '/appEval/toggleIsPriority/' + this.discussApp.id, { isPriority: this.discussApp.isPriority });
                if (a) {
                    if (a.error) {
                        this.info = a.error;
                    } else {
                        await this.$emit('update-application', a);
                    }
                } 
            }else{
                const er = await this.executePost(
                    '/bnEval/toggleIsPriority/' + this.discussRound.id, { isPriority: this.discussRound.isPriority });
                if (er) {
                    if (er.error) {
                        this.info = er.error;
                    } else {
                        await this.$emit('update-eval-round', er);
                    }
                } 
            }
        },
        async toggleLowActivity(e) {
            const er = await this.executePost(
                '/bnEval/toggleIsLowActivity/' + this.discussRound.id, { isLowActivity: this.discussRound.isLowActivity }, e);
            if (er) {
                if (er.error) {
                    this.info = er.error;
                } else {
                    await this.$emit('update-eval-round', er);
                }
            } 
        },
    },
};
</script>

<style>


</style>