<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="discussion" class="modal-content">
                <div class="modal-header text-dark bg-nat-logo">
                    <h5 class="modal-title">
                        <a v-if="discussion.discussionLink.length" class="text-dark" :href="discussion.discussionLink" target="_blank">{{ discussion.title }}</a>
                        <span v-else class="text-dark">{{ discussion.title }}</span>
                        <i v-if="discussion.mode.indexOf('osu') >= 0" class="far fa-circle" />
                        <i v-if="discussion.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
                        <i v-if="discussion.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                        <i v-if="discussion.mode.indexOf('mania') >= 0" class="fas fa-stream" />
                        <span v-if="discussion.mode.indexOf('all') >= 0">
                            <i class="far fa-circle" />
                            <i class="fas fa-drum" />
                            <i class="fas fa-apple-alt" />
                            <i class="fas fa-stream" />
                        </span>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="text-shadow mb-4">
                        <p class="min-spacing">
                            <a v-if="discussion.discussionLink.length" :href="discussion.discussionLink" target="_blank">Read and contribute to the full discussion here</a>
                        </p>
                        <small class="ml-2">Proposal: <i v-html="filterLinks(discussion.shortReason)" /></small>
                    </div>

                    <div v-if="isNat && !isLeader && discussion.isActive">
                        <p class="min-spacing text-shadow">Counted votes ({{ discussion.mediations.length }}):</p>
                        <ul>
                            <li v-for="mediation in discussion.mediations" :key="mediation.id" class="small">{{ mediation.mediator.username }}</li>
                        </ul>
                    </div>

                    <!--leader options-->
                    <div v-if="!discussion.isNatOnly && isLeader">
                        <hr>
                        <p class="min-spacing my-2 text-shadow">
                            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in agreeMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in neutralMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in disagreeMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <button v-if="discussion.isActive" class="btn btn-sm btn-nat mt-3" @click="concludeMediation($event)">
                            Conclude Vote
                        </button>
                    </div>
                    
                    <!--nat votes-->
                    <div v-else-if="discussion.isActive && discussion.isNatOnly" class="text-shadow">
                        <p class="min-spacing my-2">Total votes ({{ discussion.mediations.length }}):</p>
                        <ul>
                            <li v-for="mediation in discussion.mediations" :key="mediation.id" class="small">{{ mediation.mediator.username }}</li>
                        </ul>
                        <button v-if="isLeader" class="btn btn-sm btn-nat mt-3" @click="concludeMediation($event)">
                            Conclude Vote
                        </button>
                    </div>

                    <!--concluded discussions-->
                    <div v-else-if="!discussion.isActive">
                        <hr>
                        <p class="min-spacing my-2 text-shadow">
                            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <ul v-if="discussion.isNatOnly || isLeader">
                            <li v-for="mediation in agreeMediations" :key="mediation.id" class="small ml-2">
                                {{ mediation.mediator.username }}: 
                                <pre v-if="mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
                                <i v-else>No comment...</i>
                            </li>
                        </ul>
                        <p class="min-spacing my-2 text-shadow">
                            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <ul v-if="discussion.isNatOnly || isLeader">
                            <li v-for="mediation in neutralMediations" :key="mediation.id" class="small ml-2">
                                {{ mediation.mediator.username }}: 
                                <pre v-if="mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
                                <i v-else>No comment...</i>
                            </li>
                        </ul>
                        <p class="min-spacing my-2 text-shadow">
                            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/discussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <ul v-if="discussion.isNatOnly || isLeader">
                            <li v-for="mediation in disagreeMediations" :key="mediation.id" class="small ml-2">
                                {{ mediation.mediator.username }}: 
                                <pre v-if="mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
                                <i v-else>No comment...</i>
                            </li>
                        </ul>
                    </div>

                    <!--mediator options-->
                    <div v-if="discussion.isActive && (userModes.indexOf(discussion.mode) >= 0 || discussion.mode == 'all' || isLeader)">
                        <hr>
                        <div class="mb-2">
                            <div v-if="discussion.isNatOnly" class="form-group">
                                <textarea
                                    id="comment"
                                    v-model="comment"
                                    class="form-control dark-textarea"
                                    style="white-space: pre-line;"
                                    placeholder="Why you agree/disagree with the proposed change(s)..."
                                    rows="2"
                                />
                            </div>
                            <span class="mr-3 text-shadow">Vote:</span>
                            <div class="form-check form-check-inline">
                                <input
                                    id="1"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="1"
                                    :checked="vote == 1"
                                >
                                <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input
                                    id="2"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="2"
                                    :checked="vote == 2"
                                >
                                <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input
                                    id="3"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="3"
                                    :checked="vote == 3"
                                >
                                <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
                            </div>
                            <p v-if="!discussion.isNatOnly" class="small ml-2">
                                Only NAT leaders can see your vote. If you have any feedback to improve the proposal, post on the thread.
                            </p>
                        </div>
                        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                            {{ info }} {{ confirm }}
                        </div>
                    </div>
                    <p v-else-if="discussion.isActive" class="small">
                        Because you're not proficient in this proposal's game mode, you're not able to vote :(
                    </p>
                </div>
                <div class="modal-footer">
                    <button v-if="discussion.isActive && (userModes.indexOf(discussion.mode) >= 0 || discussion.mode == 'all' || isNat)" class="btn btn-sm btn-nat" @click="submitMediation($event)">
                        Submit Vote
                    </button>
                    <p v-else class="text-shadow min-spacing">
                        {{ discussion.createdAt.slice(0, 10) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';

export default {
    name: 'DiscussionInfo',
    mixins: [ postData, filterLinks ],
    props: [ 'discussion', 'userId', 'userModes', 'isLeader', 'isNat' ],
    data() {
        return {
            info: '',
            confirm: '',
            mediators: null,
            vote: null,
            comment: '',
            mediationId: null,
        };
    },
    computed: {
        majority(){
            let total = 0;
            this.discussion.mediations.forEach(mediation => {
                if(mediation.vote == 1) total++;
                if(mediation.vote == 3) total--;
            });
            return total > 0 ? true : false;
        },
        agreeMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 2);
        },
        disagreeMediations(){
            return this.discussion.mediations.filter(mediation => mediation.vote == 3);
        },
    },
    watch: {
        discussion() {
            this.vote = null;
            this.comment = '';
            this.mediators = null;
            this.mediationId = null;
            if (this.discussion.mediations.length) {
                for (let i = 0; i < this.discussion.mediations.length; i++) {
                    let mediation = this.discussion.mediations[i];
                    if(mediation.mediator.id == this.userId){
                        if(mediation.vote) this.vote = mediation.vote;
                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
        mediationId() {
            this.info = '';
            this.confirm = '';
        },
    },
    methods: {
        async submitMediation (e) {
            this.info = '';
            this.confirm = '';
            const vote = $('input[name=vote]:checked').val();
            if(!vote){
                this.info = 'Must include a vote!';
            }else{
                const d = await this.executePost(
                    '/discussionVote/submitMediation/' + this.discussion.id, 
                    { mediationId: this.mediationId, 
                        vote, 
                        comment: this.comment, 
                    }, e);
                if (d) {
                    if (d.error) {
                        this.info = d.error;
                    } else {
                        await this.$emit('update-discussion', d);
                        this.confirm = 'Vote submitted!';
                        this.vote = vote;
                    }
                }
            }
        },
        async concludeMediation (e) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure?`);
            if(result){
                const d = await this.executePost(
                    '/discussionVote/concludeMediation/' + this.discussion.id, e);
                if (d) {
                    if (d.error) {
                        this.info = d.error;
                    } else {
                        await this.$emit('update-discussion', d);
                        this.confirm = 'Discussion concluded!';
                    }
                }
            }
        },
    },
};
</script>

<style>
    .bg-active {
        background-color: var(--available);
    }

    .bg-inactive {
        background-color: var(--withdrawn);
    }
    
</style>
