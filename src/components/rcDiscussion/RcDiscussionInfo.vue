<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="rcDiscussion" class="modal-content">
                <div class="modal-header text-dark bg-nat-logo">
                    <h5 class="modal-title">
                        <a class="text-dark" :href="rcDiscussion.discussionLink" target="_blank">{{ rcDiscussion.title }}</a>
                        <i v-if="rcDiscussion.mode.indexOf('osu') >= 0" class="far fa-circle" />
                        <i v-if="rcDiscussion.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
                        <i v-if="rcDiscussion.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                        <i v-if="rcDiscussion.mode.indexOf('mania') >= 0" class="fas fa-stream" />
                        <span v-if="rcDiscussion.mode.indexOf('all') >= 0">
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
                            <a :href="rcDiscussion.discussionLink" target="_blank">Read and contribute to the full Ranking Criteria discussion here</a>
                        </p>
                        <small class="ml-2">Proposal: <i v-html="filterLinks(rcDiscussion.shortReason)" /></small>
                    </div>

                    <!--leader options-->
                    <div v-if="isLeader">
                        <hr>
                        <p class="min-spacing my-2 text-shadow">
                            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in agreeMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in neutralMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p v-for="mediation in disagreeMediations" :key="mediation.id" class="small min-spacing ml-2">
                            {{ mediation.mediator.username }}
                        </p>
                        <button v-if="rcDiscussion.isActive" class="btn btn-sm btn-nat mt-3" @click="concludeMediation($event)">
                            Conclude Vote
                        </button>
                    </div>
                    <div v-else-if="!rcDiscussion.isActive">
                        <hr>
                        <p class="min-spacing my-2 text-shadow">
                            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                        <p class="min-spacing my-2 text-shadow">
                            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/rcDiscussion.mediations.length)*100) || 0 }}%)
                        </p>
                    </div>

                    <!--mediator options-->
                    <div v-if="rcDiscussion.isActive && (userModes.indexOf(rcDiscussion.mode) >= 0 || rcDiscussion.mode == 'all' || isLeader)">
                        <hr>
                        <div class="mb-2">
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
                            <p class="small ml-2">
                                Only NAT leaders can see your vote. If you have any feedback to improve the proposal, post on the thread.
                            </p>
                        </div>
                        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                            {{ info }} {{ confirm }}
                        </div>
                    </div>
                    <p v-else-if="rcDiscussion.isActive" class="small">
                        Because you're not proficient in this proposal's game mode, you're not able to vote :(
                    </p>
                </div>
                <div class="modal-footer">
                    <button v-if="rcDiscussion.isActive && (userModes.indexOf(rcDiscussion.mode) >= 0 || rcDiscussion.mode == 'all' || isLeader)" class="btn btn-sm btn-nat" @click="submitMediation($event)">
                        Submit Vote
                    </button>
                    <p v-else class="text-shadow min-spacing">
                        {{ rcDiscussion.createdAt.slice(0, 10) }}
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
    name: 'RcDiscussionInfo',
    mixins: [ postData, filterLinks ],
    props: [ 'rcDiscussion', 'userId', 'userModes', 'isLeader' ],
    data() {
        return {
            info: '',
            confirm: '',
            mediators: null,
            vote: null,
            mediationId: null,
            newMediator: null,
        };
    },
    computed: {
        majority(){
            let total = 0;
            this.rcDiscussion.mediations.forEach(mediation => {
                if(mediation.vote == 1) total++;
                if(mediation.vote == 3) total--;
            });
            return total > 0 ? true : false;
        },
        agreeMediations(){
            return this.rcDiscussion.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations(){
            return this.rcDiscussion.mediations.filter(mediation => mediation.vote == 2);
        },
        disagreeMediations(){
            return this.rcDiscussion.mediations.filter(mediation => mediation.vote == 3);
        },
    },
    watch: {
        rcDiscussion() {
            this.mediators = null;
            this.mediationId = null;
            if (this.rcDiscussion.mediations.length) {
                for (let i = 0; i < this.rcDiscussion.mediations.length; i++) {
                    let mediation = this.rcDiscussion.mediations[i];
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
                const rc = await this.executePost(
                    '/rcVote/submitMediation/' + this.rcDiscussion.id, 
                    { mediationId: this.mediationId, 
                        vote, 
                    }, e);
                if (rc) {
                    if (rc.error) {
                        this.info = rc.error;
                    } else {
                        await this.$emit('update-rc-discussion', rc);
                        this.confirm = 'Mediation submitted!';
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
                const rc = await this.executePost(
                    '/rcVote/concludeMediation/' + this.rcDiscussion.id, e);
                if (rc) {
                    if (rc.error) {
                        this.info = rc.error;
                    } else {
                        await this.$emit('update-rc-discussion', rc);
                        this.confirm = 'Mediation concluded!';
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
