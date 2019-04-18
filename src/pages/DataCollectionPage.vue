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
                <select class="custom-select" id="notability" v-model="filterVote">
                    <option class="ml-2" value="" selected>All statuses</option>
                    <option class="ml-2" value="1">Notable</option>
                    <option class="ml-2" value="2">Semi</option>
                    <option class="ml-2" value="3">Not notable</option>
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
                <p class="mx-2">Each reason should be as concise as possible. For common reasons, try to use the same formatting as previously written reasons to avoid different interpretations. Keep in mind that there's a low character limit forcing you to keep it short.</p>
                <h5>Decide relevancy of DQs/resets</h5>
                <p class="mx-2">All events are accounted for in a BN's performance evaluation. Many events resulting from minor or subjective issues aren't important enough to require punishment. "Notability" serves as a way to mark which DQs/resets are applicable for judgment on a BN's evaluations.</p>
                <p class="mx-2"><span class="vote-pass">Notable</span>: Objective issues, direct violations of the Ranking Criteria</p>
                <p class="mx-2"><span class="vote-extend">Semi-notable</span>: Major subjective issues whose importance should be judged by evaluators individually</p>
                <p class="mx-2"><span class="vote-fail">Not notable</span>: Anything else</p>
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
                    <td scope="col" data-toggle="tooltip" data-placement="top" title="Marks objectivity/subjectivity of issue for reference in BN Evaluations">Notability</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="dq in dqs" :key="dq.id" 
                        :class="dq.valid == 1 ? 'vote-border-pass-wide' : dq.valid == 2 ? 'vote-border-extend-wide' : dq.valid == 3 ? 'vote-border-fail-wide' : ''"
                    >
                        <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">{{dq.metadata.length > 50 ? dq.metadata.slice(0, 50) + '...' : dq.metadata}}</a>
                        </td>
                        <td scope="row">
                            {{dq.content.length > 50 ? dq.content.slice(0, 50) + '...' : dq.content}} 
                            <a href="#" class="float-right" data-toggle="modal" data-target="#editReason" :data-entry="dq.id" @click.prevent="selectEntry(dq)">edit</a>
                            </td>
                        <td scope="row" style="width: 72px;">
                            <a href="#" @click.prevent="updateNotability(dq.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="notable"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateNotability(dq.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="semi-notable"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateNotability(dq.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="not notable"
                            ><i class="fas fa-square vote-fail"></i></a>
                            <a href="#" @click.prevent="updateNotability(dq.id, null);"
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
                    <td scope="col" data-toggle="tooltip" data-placement="top" title="Marks objectivity/subjectivity of issue for reference in BN Evaluations">Notability</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="pop in pops" :key="pop.id"
                        :class="pop.valid == 1 ? 'vote-border-pass-wide' : pop.valid == 2 ? 'vote-border-extend-wide' : pop.valid == 3 ? 'vote-border-fail-wide' : ''"
                    >
                        <td scope="row">{{new Date(pop.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">{{pop.metadata.length > 50 ? pop.metadata.slice(0, 50) + '...' : pop.metadata}}</a>
                        </td>
                        <td scope="row">
                            {{pop.content.length > 50 ? pop.content.slice(0, 50) + '...' : pop.content}} 
                            <a href="#" class="float-right" data-toggle="modal" data-target="#editReason" :data-entry="pop.id" @click.prevent="selectEntry(pop)">edit</a>
                        </td>
                        <td scope="row" style="width: 72px;">
                            <a href="#" @click.prevent="updateNotability(pop.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="notable"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateNotability(pop.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="semi-notable"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateNotability(pop.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="not notable"
                            ><i class="fas fa-square vote-fail"></i></a>
                            <a href="#" @click.prevent="updateNotability(pop.id, null);"
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
                <div class="modal-header text-dark" :class="selectedEntry.valid == 1 ? 'badge-pass' : selectedEntry.valid == 2 ? 'badge-extend' : selectedEntry.valid == 3 ? 'badge-fail' : 'bg-nat-logo'">
                    <h5 class="modal-title">Edit DQ/Reset</h5>
                    <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="container">
                        <p class="text-shadow">Mapset: <a :href="'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/events'" target="_blank">{{selectedEntry.metadata}}</a></p>
                        <p class="text-shadow">Current reason: </p>
                        <p class="text-shadow small ml-4">{{selectedEntry.content}}</p>
                        <p class="text-shadow" for="newReason">New reason:</p>
                        <div class="input-group input-group-sm">
                            <input class="form-control form-control-sm" type="text" placeholder="Reason..." id="newReason" 
                                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 100px 100px 100px" 
                                @keyup.enter="updateReason($event)" maxlength="50" v-model="reasonInput"/>
                        </div>
                        <p class="text-shadow mt-4">Notability:
                            <a href="#" @click.prevent="updateNotability(selectedEntry.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="notable"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateNotability(selectedEntry.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="semi-notable"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateNotability(selectedEntry.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="not notable"
                            ><i class="fas fa-square vote-fail"></i></a>
                            <a href="#" @click.prevent="updateNotability(selectedEntry.id, null);"
                                data-toggle="tooltip" data-placement="top" title="unmarked"
                            ><i class="fas fa-square"></i></a>
                        </p>
                        
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
        selectedEntry: function() {
            this.reasonInput = '';
        }
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
            if(!this.reasonInput || !this.reasonInput.length){
                this.info = "Must enter a reason!"
            }else{
                const result = await this.executePost('/dataCollection/updateReason/' + this.selectedEntry.id, { reason: this.reasonInput }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.updateEntry(result);
                    }
                }
            }
        },
        updateNotability: async function(entryId, notability) {
            const result = await this.executePost('/dataCollection/updateNotability/' + entryId, { notability: notability });
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
            reasonInput: '',
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
