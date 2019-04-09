<template>

<div id="extendedInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="veto">
            <div class="modal-header text-dark" :class="'bg-' + veto.status">
                <h5 class="modal-title">
                    <a class="text-dark" :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId" target="_blank">{{ veto.beatmapTitle }}</a> by 
                    <a class="text-dark" :href="'https://osu.ppy.sh/users/' + veto.beatmapMapperId" target="_blank">{{ veto.beatmapMapper }}</a>
                    <i v-if="veto.mode.indexOf('osu') >= 0" class="far fa-circle"></i>
                    <i v-if="veto.mode.indexOf('taiko') >= 0" class="fas fa-drum"></i>
                    <i v-if="veto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt"></i>
                    <i v-if="veto.mode.indexOf('mania') >= 0" class="fas fa-stream"></i>
                </h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <div class="text-shadow mb-2">
                    <p class="min-spacing"><a :href="veto.discussionLink" target="_blank">Read the veto discussion here</a></p>
                    <small class="ml-2">Veto reason: <i>{{ veto.shortReason }}</i></small>
                </div>
                <p class="min-spacing text-shadow">Consensus: {{
                    veto.status == 'upheld' || veto.status == 'withdrawn' ? 'Veto ' + veto.status : 'none' 
                }}</p>
                <div class="text-shadow" v-if="isLeader">
                    <hr>
                    <div v-if="veto.mediations.length">
                        <ul style="list-style-type: none; padding-left: 0.5rem">
                            <li v-for="mediation in veto.mediations" :key="mediation.id">
                                <span class="small" :class="mediation.vote == 1 ? 'vote-pass' : mediation.vote == 2 ? 'vote-neutral' : mediation.vote == 3 ? 'vote-fail' : ''">
                                    {{mediation.mediator.username}}: {{mediation.comment ? mediation.comment : '...'}}
                                </span>    
                            </li>
                        </ul>
                        <div id="conclusion" class="copy-paste">
                            <samp class="small">Hello! This beatmap has undergone veto mediation by the Beatmap Nominators. The veto post can be found here: {{veto.discussionLink}}</samp><br><br>
                            <samp class="small">After an anonymous vote, it has been decided that the veto will be {{majority ? 'upheld' : 'dismissed'}}. The following are reasons why Beatmap Nominators {{majority ? 'agree' : 'disagree'}} with the veto:</samp><br><br>
                            <div v-if="majority">
                                <span v-for="(mediation, i) in upholdMediations" :key="mediation.id">
                                    <samp><pre class="small">({{i+1}}): {{mediation.comment}}</pre></samp><br>
                                </span>
                                <samp class="small">This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator(s) are satisfied.</samp>
                            </div>
                            <div v-else>
                                <span v-for="(mediation, i) in withdrawMediations" :key="mediation.id">
                                    <samp><pre class="small">({{i+1}}): {{mediation.comment}}</pre></samp><br>
                                </span>
                                <samp class="small">Due to the veto being withdrawn, this beatmap may now be re-nominated.</samp>
                            </div>
                        </div>
                        <span v-if="veto.status != 'upheld' && veto.status != 'withdrawn'">
                            <button class="btn btn-sm" :class="majority ? 'btn-nat' : 'btn-nat-red'" @click="concludeMediation($event)">{{majority ? 'Uphold Veto' : 'Withdraw Veto'}}</button>
                            <button class="btn btn-sm btn-nat" @click="concludeMediation($event, true)">Dismiss Without Mediation</button>
                        </span>
                    </div>
                    <div v-else-if="veto.status != 'upheld' && veto.status != 'withdrawn'">
                        <button class="btn btn-sm btn-nat mb-2" @click="selectMediators($event)">{{mediators ? 'Re-select Mediators' : 'Select Mediators'}}</button> 
                        <button v-if="mediators" class="btn btn-sm btn-nat-red mb-2" @click="beginMediation($event)">Begin Mediation</button>
                        <button class="btn btn-sm btn-nat mb-2" @click="concludeMediation($event, true)">Dismiss Without Mediation</button>
                        <div class="mb-2">
                            <span class="text-shadow">Exclude specific user(s):</span> 
                            <input id="excludeUsers" class="text-input ml-1 w-75 small" type="text" placeholder="username1, username2, username3..." /><br>
                            <small class="ml-2 text-shadow">The mapper and veto submitter are automatically excluded</small>
                        </div>
                        <div class="mt-2" v-if="mediators">
                            <p>Users:</p>
                            <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                                <ul style="list-style-type: none; padding: 0">
                                    <li v-for="user in mediators" :key="user.id"><samp class="small">{{user.username}}</samp></li>
                                </ul>
                            </div>
                            <p>Forum message:</p>
                            <div id="forumMessage" class="copy-paste">
                                <samp class="small">Hello!</samp><br><br>
                                <samp class="small">You have been selected as a veto mediator for [url=https://osu.ppy.sh/beatmapsets/{{veto.beatmapId}}]{{ veto.beatmapTitle }}[/url].</samp><br><br>
                                <samp class="small">The map is currently vetoed for the following reason:</samp><br><br>
                                <samp class="small">[notice]{{veto.shortReason}}[/notice]</samp><br><br>
                                <samp class="small">Veto discussion can be found [url={{veto.discussionLink}}]here[/url].</samp><br><br>
                                <samp class="small">Please post your opinion regarding the veto on the [url=http://bn.mappersguild.com/vetoes]BN/NAT website[/url] in [b]one week[/b]. Your decision will be anonymous to everyone but members of the NAT.</samp><br><br>
                                <samp class="small">If you do not participate in this veto mediation, the NAT will question your standing as a Beatmap Nominator. If you do not want to participate in future veto mediations, opt-out from the [url=http://bn.mappersguild.com/users]users page[/url].</samp><br><br>
                                <samp class="small">Thank you for your hard work!</samp><br><br>
                            </div>
                        </div>
                    </div>
                    <div v-else>
                        <p class="text-shadow min-spacing">This veto's mediation was dismissed due to being invalid, inappropriate, or resolved by the mapper.</p>
                    </div>
                </div>
                <div v-if="mediationId && veto.status == 'wip'">
                    <hr>
                    <p class="text-shadow min-spacing mb-2">Reason for vote:</p>
                    <p class="text-shadow small min-spacing mb-1 ml-2">This comment will be displayed anonymously alongside the verdict post. If your response is deemed inappropriate, your vote will be marked as invalid.</p>
                    <div class="form-group">
                        <textarea class="form-control dark-textarea" style="white-space: pre-line;" placeholder="Why you agree/disagree with the veto..." id="comment" rows="2" v-model="comment"></textarea>
                    </div>
                    <div class="mb-2">
                        <span class="mr-3 text-shadow">Vote:</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="vote" id="1" value="1" :checked="vote == 1">
                            <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="vote" id="2" value="2" :checked="vote == 2">
                            <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="vote" id="3" value="3" :checked="vote == 3">
                            <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
                        </div>
                    </div>
                    <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">{{info}} {{confirm}}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button v-if="mediationId && veto.status == 'wip'" class="btn btn-sm btn-nat" @click="submitMediation($event)">Submit Mediation</button>
                <p v-else class="text-shadow min-spacing">{{ veto.createdAt.slice(0, 10) }}</p>
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from "../../mixins/postData.js";

export default {
    name: 'veto-info',
    props: [ 'veto', 'user-id', 'is-leader' ],
    mixins: [ postData ],
    watch: {
        veto: function() {
            this.mediators = null;
            this.mediationId = null;
            if (this.veto.mediations.length) {
                for (let i = 0; i < this.veto.mediations.length; i++) {
                    let mediation = this.veto.mediations[i];
                    if(mediation.mediator.id == this.userId){
                        if(mediation.comment) this.comment = mediation.comment;
                        if(mediation.vote) this.vote = mediation.vote;
                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
    },
    data() {
        return {
            info: '',
            confirm: '',
            mediators: null,
            comment: '',
            vote: null,
            mediationId: null,
        }
    },
    methods: {
        selectMediators: async function(e) {
            let excludeUsers = $('#excludeUsers').val().split(',');
            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }
            excludeUsers.push(this.veto.beatmapMapper.toLowerCase(), this.veto.vetoer.username.toLowerCase());
            const r = await this.executePost('/vetoes/selectMediators', {mode: this.veto.mode, excludeUsers: excludeUsers}, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.mediators = r;
                }
            }
        },
        beginMediation: async function(e) {
            const r = await this.executePost('/vetoes/beginMediation/' + this.veto.id, {mediators: this.mediators}, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        },
        submitMediation: async function (e) {
            this.info = '';
            this.confirm = '';
            const vote = $('input[name=vote]:checked').val();
            if(!vote || !this.comment.length){
                this.info = 'Cannot leave fields blank!'
            }else{
                const v = await this.executePost(
                    '/vetoes/submitMediation/' + this.veto.id, 
                    { mediationId: this.mediationId, 
                    vote: vote, 
                    comment: this.comment
                    }, e);
                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        await this.$emit('update-veto', v);
                        this.confirm = "Mediation submitted!"
                        this.vote = vote;
                    }
                }
            }
        },
        concludeMediation: async function (e, dismiss) {
            this.info = '';
            this.confirm = '';
            const v = await this.executePost(
                '/vetoes/concludeMediation/' + this.veto.id, 
                { majority: this.majority, dismiss: dismiss }, e);
            if (v) {
                if (v.error) {
                    this.info = v.error;
                } else {
                    await this.$emit('update-veto', v);
                    this.confirm = "Mediation concluded!"
                }
            }
            
        },
    },
    computed: {
        majority: function(){
            let total = 0;
            this.veto.mediations.forEach(mediation => {
                if(mediation.vote == 1) total++;
                if(mediation.vote == 3) total--;
            });
            return total > 0 ? true : false;
        },
        upholdMediations: function(){
            return this.veto.mediations.filter(mediation => mediation.vote == 1);
        },
        withdrawMediations: function(){
            return this.veto.mediations.filter(mediation => mediation.vote == 3);
        }
    },
}
</script>

<style>
    .bg-available {
        background-color: var(--available);
    }
    .bg-wip {
        background-color: var(--wip);
    }
    .bg-upheld {
        background-color: var(--upheld);
    }
    .bg-withdrawn {
        background-color: var(--withdrawn);
    }
    
</style>
