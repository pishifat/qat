<template>

<div class="row">
    <div class="col-md-12">
        <section class="segment my-1">
            <small
                >Search:
                <input
                    id="search"
                    class="ml-1"
                    v-model="filterValue"
                    type="text"
                    placeholder="beatmap..."
                />
            </small>
            <small class="ml-1">
                <select class="custom-select" id="mode" v-model="filterMode">
                    <option class="ml-2" value="" selected>All modes</option>
                    <option class="ml-2" value="osu">osu!</option>
                    <option class="ml-2" value="taiko">osu!taiko</option>
                    <option class="ml-2" value="catch">osu!catch</option>
                    <option class="ml-2" value="mania">osu!mania</option>
                </select>
            </small>
            <small class="ml-1">
                <select class="custom-select" id="validity" v-model="filterVote">
                    <option class="ml-2" value="" selected>All statuses</option>
                    <option class="ml-2" value="1">Valid</option>
                    <option class="ml-2" value="2">Partial</option>
                    <option class="ml-2" value="3">Invalid</option>
                    <option class="ml-2" value="none">Unmarked</option>
                </select>
            </small>
        </section>
        <section class="segment my-1">
            <a data-toggle="collapse" href="#howToUse">How do I use this page? <i class="fas fa-angle-down"></i></a> 
            <div id="howToUse" class="collapse mt-4 mx-2">
                <p class="mx-2">This page is used to make BN evaluations more consistent and convenient. As a member of the NAT, your roles here are to...</p>
                <h5>Shorten "reason" information</h5>
                <p class="mx-2">DQ/reset reasons are inconsistent, too wordy, and can be misleading (especially when written by BNs). By editing the reason, you'll be able to fix those problems.</p>
                <p class="mx-2">Each reason should be as concise as possible. For common reasons, select an option from the dropdown so that evaluators don't need to interpret repeated reasons in multiple ways. If you believe a reason is common enough to deserve placement in the dropdown, tell pishifat. For less common reasons, write a summary in the input box below. There's a low character limit forcing you to keep it short.</p>
                <h5>Decide relevancy of DQs/resets</h5>
                <p class="mx-2">All events are accounted for in a BN's performance evaluation. Many events resulting from minor or subjective issues aren't important enough to require punishment. "Validity" serves as a way to mark which DQs/resets are applicable for judgment on a BN's evaluations.</p>
                <p class="mx-2"><span class="vote-pass">Valid</span>: Objective issues, direct violations of the Ranking Criteria</p>
                <p class="mx-2"><span class="vote-extend">Partially valid</span>: Major subjective issues whose importance should be judged by evaluators individually</p>
                <p class="mx-2"><span class="vote-fail">Invalid</span>: Anything else</p>
                <p class="mx-2">If you're unsure how to mark something, ask another NAT member for their opinion</p>
                <h5>Keep up to date with this page</h5>
                <p class="mx-2">It's necessary to track DQ/reset information before reasons become impossible to interpret. A mapper could change the map and involved parties could forget details of the issue. BN evaluations rely on understanding a user's mistakes, so falling behind on data collection will affect future BN evaluations!</p>
            </div>
        </section>
        <section class="segment segment-image mx-0">
            <h2>Disqualifications</h2>
            <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">Date</td>
                    <td scope="col">Mapset</td>
                    <td scope="col">Reason</td>
                    <td scope="col" data-toggle="tooltip" data-placement="top" title="Marks objectivity/subjectivity of issue for reference in BN Evaluations">Validity</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="dq in dqs" :key="dq.id" 
                        :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">{{dq.metadata}}</a>
                        </td>
                        <td scope="row">
                            {{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}} 
                            <a href="#" data-toggle="modal" data-target="#editReason" :data-entry="dq.id" @click.prevent="selectEntry(dq)">edit</a>
                            </td>
                        <td scope="row" style="width: 72px;">
                            <a href="#" @click.prevent="updateValidity(dq.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="valid"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateValidity(dq.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="partially valid"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateValidity(dq.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="invalid"
                            ><i class="fas fa-square vote-fail"></i></a>
                            <a href="#" @click.prevent="updateValidity(dq.id, null);"
                                data-toggle="tooltip" data-placement="top" title="unmarked"
                            ><i class="fas fa-square"></i></a>
                        </td>
                        <td scope="row">
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="col-md-12 segment segment-image mx-0">
            <h2>Pops</h2>
            <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">Date</td>
                    <td scope="col">Mapset</td>
                    <td scope="col">Reason</td>
                    <td scope="col" data-toggle="tooltip" data-placement="top" title="Marks objectivity/subjectivity of issue for reference in BN Evaluations">Validity</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="pop in pops" :key="pop.id"
                        :class="pop.valid == 1 ? 'vote-border-pass' : pop.valid == 2 ? 'vote-border-extend' : pop.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">{{new Date(pop.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion'" target="_blank">{{pop.metadata}}</a>
                        </td>
                        <td scope="row">
                            {{pop.content.slice(0, pop.content.indexOf('.')+1) || pop.content}} 
                            <a href="#" data-toggle="modal" data-target="#editReason" :data-entry="pop.id" @click.prevent="selectEntry(pop)">edit</a>
                        </td>
                        <td scope="row" style="width: 72px;">
                            <a href="#" @click.prevent="updateValidity(pop.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="valid"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateValidity(pop.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="partially valid"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateValidity(pop.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="invalid"
                            ><i class="fas fa-square vote-fail"></i></a>
                            <a href="#" @click.prevent="updateValidity(pop.id, null);"
                                data-toggle="tooltip" data-placement="top" title="unmarked"
                            ><i class="fas fa-square"></i></a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>

    <div id="editReason" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content custom-bg-dark" v-if="selectedEntry">
                <div class="modal-header text-dark bg-nat-logo" >
                    <h5 class="modal-title">Edit reason</h5>
                    <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="container">
                        <p class="text-shadow">Current reason: </p>
                        <p class="text-shadow small ml-4">{{selectedEntry.content}}</p>
                        <p class="text-shadow" for="newReason">New reason:</p>
                        <small>
                            <select class="custom-select w-100" id="reasonSelect">
                                <option class="ml-2" value="" selected>Reason selection...</option>
                                <option class="ml-2" value="">GENERAL</option>
                                <option class="ml-2 text-secondary" value="reason">Requested</option>
                                <option class="ml-2 text-secondary" value="reason">Map reaches Ranked soon without mod replies</option>
                                <option class="ml-2 text-secondary" value="reason">Unused file(s)</option>
                                <option class="ml-2 text-secondary" value="reason">Nominated by two probation BNs</option>
                                <option class="ml-2 text-secondary" value="reason">Difficulty settings mistake</option>
                                <option class="ml-2 text-secondary" value="reason">NSFW content in bg/video</option>
                                <option class="ml-2" value="">SNAPPING</option>
                                <option class="ml-2 text-secondary" value="reason">Object wrongly snapped</option>
                                <option class="ml-2 text-secondary" value="reason">Section of objects wrongly snapped</option>
                                <option class="ml-2" value="">SPREAD</option>
                                <option class="ml-2 text-secondary" value="reason">Inappropriate difficulty elements for intended diff</option>
                                <option class="ml-2 text-secondary" value="reason">Does not meet minimum drain time</option>
                                <option class="ml-2" value="">TIMING</option>
                                <option class="ml-2 text-secondary" value="reason">Offset incorrect by more than 10ms</option>
                                <option class="ml-2 text-secondary" value="reason">Offset incorrect by less than 10ms</option>
                                <option class="ml-2 text-secondary" value="reason">Multiple incorrect offsets (complex timing)</option>
                                <option class="ml-2 text-secondary" value="reason">Incorrect time signature(s)</option>
                                <option class="ml-2" value="">METADATA</option>
                                <option class="ml-2 text-secondary" value="reason">Incorrect metadata (artist or title or source)</option>
                                <option class="ml-2 text-secondary" value="reason">Missing username in tags</option>
                                <option class="ml-2" value="">AUDIO</option>
                                <option class="ml-2 text-secondary" value="reason">Muted hitobject(s)</option>
                                <option class="ml-2 text-secondary" value="reason">Hitsound volume too low</option>
                                <option class="ml-2 text-secondary" value="reason">Section unhitsounded</option>
                            </select>
                        </small>
                        <div class="input-group input-group-sm my-3">
                            <input class="form-control form-control-sm" type="text" placeholder="Manual input... (prioritize dropdown)" id="newReason" 
                                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 100px 100px 100px" 
                                @keyup.enter="updateReason($event)" maxlength="50"/>
                        </div>
                        
                    </div>
                    <p id="errors">{{info}}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-nat" @click="updateReason($event)" type="submit"><span class="append-button-padding">Save reason</span></button>
                </div>
            </div>
        </div>
    </div>

</div>

</template>



<script>
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';

export default {
    name: 'data-collection-page',
    mixins: [postData, filters],
    watch: { 
        allObjs: function(){
            this.filter();
        },
    },
    methods: {
        filterBySearchValueContext: function(o) {
            if (o.metadata.toLowerCase().indexOf(this.filterValue.toLowerCase()) >= 0) {
                return true;
            } else {
                return false;
            }
        },
        separateObjs: function() {
            this.dqs = this.pageObjs.filter(v => v.eventType == 'Disqualified');
            this.pops = this.pageObjs.filter(v => v.eventType == 'Popped');
        },
        updateEntry: function (obj) {
			const i = this.allObjs.findIndex(o => o.id == obj.id);
            this.allObjs[i] = obj;
            this.selectedEntry = obj;
            this.filter();
        },
        selectEntry: function (entry) {
            this.selectedEntry = entry;
        },
        updateReason: async function(e) {
            let reason;
            if($("#reasonSelect option:selected").val().length){
                reason = $("#reasonSelect option:selected").text();
            }else{
                reason = $("#newReason").val();
            }
            if(!reason || !reason.length){
                this.info = "Must enter a reason!"
            }else{
                const result = await this.executePost('/dataCollection/updateReason/' + this.selectedEntry.id, { reason: reason }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.updateEntry(result);
                    }
                }
            }
        },
        updateValidity: async function(entryId, validity) {
            const result = await this.executePost('/dataCollection/updateValidity/' + entryId, { validity: validity });
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.updateEntry(result);
                }
            }
        },
    },
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            dqs: null,
            pops: null,
            selectedEntry: null,
            info: '',
        }
    },
    created() {
        axios
            .get('/dataCollection/relevantInfo')
            .then(response => {
                this.allObjs = response.data.events;
                this.filterMode = response.data.mode;
                this.hasPagination = false;
                this.hasSeparation = true;
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
}
</script>

<style>
    
</style>
