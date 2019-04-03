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
                <div class="text-shadow">
                    <a :href="veto.discussionLink" target="_blank">Read the veto discussion here</a>
                    <br>
                    <small class="ml-2">Veto reason: <i>{{ veto.shortReason }}</i></small>
                </div>
                <hr>
                <div class="text-shadow" v-if="userGroup == 'nat'">
                    <div v-if="veto.mediations.length">
                        <ul style="list-style-type: none; padding-left: 0.5rem">
                            <li v-for="mediation in veto.mediations" :key="mediation.id">
                                <span class="small" :class="mediation.vote == 1 ? 'vote-pass' : mediation.vote == 2 ? 'vote.neutral' : mediation.vote == 3 ? 'vote-fail' : ''">
                                    {{mediation.mediator.username}}: {{mediation.comment ? mediation.comment : '...'}}
                                </span>    
                            </li>
                        </ul>
                    </div>
                    <div v-else>
                        <button class="btn btn-sm btn-nat mb-4" @click="selectMediators($event)">{{mediators ? 'Re-select Mediators' : 'Select Mediators'}}</button>
                        <button v-if="mediators" class="btn btn-sm btn-nat-red mb-4" @click="beginMediation($event)">Begin Mediation</button>
                        <div v-if="mediators">
                            <p>Users:</p>
                            <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                                <ul style="list-style-type: none; padding: 0">
                                    <li v-for="user in mediators" :key="user.id"><samp class="small">{{user.username}}</samp></li>
                                </ul>
                            </div>
                            <p>Forum message:</p>
                            <div id="forumMessage" class="copy-paste">
                                <samp class="small">Hello! You have been selected as a veto mediator for [url=https://osu.ppy.sh/beatmapsets/{{veto.beatmapId}}]{{ veto.beatmapTitle }}[/url].</samp>
                                <samp class="small">The map is currently vetoed for the following reason: [code]{{veto.shortReason}}[/code]</samp>
                                <samp class="small">Veto discussion can be found [url={{veto.discussionLink}}]here[/url].</samp>
                                <samp class="small">Please respond to the veto with your opinion on the [url=#]NAT website[/url] in less than one week. If you wish to opt-out of future veto mediations, do so [url=#]here[/url].</samp>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="mediatiorIds && mediatiorIds.indexOf(userId) >= 0">
                    mediation inputs
                </div>
                <hr>
                <p class="text-shadow">
                    Status: <small>{{ veto.status }}</small>
                    <button class="btn btn-sm btn-nat" @click="setStatus('upheld')">Upheld</button>
                    <button class="btn btn-sm btn-nat" @click="setStatus('withdrawn')">Withdrawn</button>
                </p>
            </div>
            <div class="modal-footer">
                {{ this.info }}
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from "../../mixins/postData.js";

export default {
    name: 'veto-info',
    props: [ 'veto', 'user-id', 'user-group' ],
    mixins: [ postData ],
    watch: {
        veto: function() {
            this.mediators = null;
        },
    },
    data() {
        return {
            info: null,
            mediators: null,
        }
    },
    methods: {
        mediate: async function() {
            const r = await this.executePost('/nat/vetoes/mediate', { veto: this.veto });
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        },
        setStatus: async function(status) {
            const r = await this.executePost('/nat/vetoes/setStatus', { veto: this.veto, status: status });
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        },
        selectMediators: async function(e) {
            const r = await this.executePost('/nat/vetoes/selectMediators', {mode: this.veto.mode}, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.mediators = r;
                }
            }
        },
        beginMediation: async function(e) {
            const r = await this.executePost('/nat/vetoes/beginMediation/' + this.veto.id, {mediators: this.mediators}, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        }
    },
    computed: {
        fullTitle: function() {
            if (this.veto.beatmapTitle) {
                return this.veto.beatmapTitle + ' by ' + this.veto.beatmapMapper
            } else {
                return 'something';
            }
        },
        mediatiorIds: function() {
            if (this.veto.mediations.length) {
                let userIds = [];
                this.veto.mediations.forEach(mediation => {
                    userIds.push(mediation.mediator.id);
                });
                return userIds;
            }
        },
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
    .copy-paste {
    background-color: darkslategray;
    margin: 0.75rem 0.75rem 0.75rem 0.75rem;
    padding: 0.75rem 0.75rem 0.75rem 0.75rem;
    box-shadow: 1px 1px 2px 1px black;
}
</style>
