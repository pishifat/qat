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
                            <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{dq.metadata.length > 50 ? dq.metadata.slice(0, 50) + '...' : dq.metadata}}
                            </a>
                        </td>
                        <td scope="row">
                            {{dq.content.length > 50 ? dq.content.slice(0, 50) + '...' : dq.content}} 
                            <a href="#" class="float-right" data-toggle="modal" data-target="#editReason" :data-entry="dq.id" @click.prevent="selectEntry(dq)">edit</a>
                            </td>
                        <td scope="row" style="width: 72px;">
                            <notability
                                :selected-entry="dq"
                                :is-spectator="isSpectator"
                            ></notability>
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
                            <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{pop.metadata.length > 50 ? pop.metadata.slice(0, 50) + '...' : pop.metadata}}
                            </a>
                        </td>
                        <td scope="row">
                            {{pop.content.length > 50 ? pop.content.slice(0, 50) + '...' : pop.content}} 
                            <a href="#" class="float-right" data-toggle="modal" data-target="#editReason" :data-entry="pop.id" @click.prevent="selectEntry(pop)">edit</a>
                        </td>
                        <td scope="row" style="width: 72px;">
                            <notability
                                :selected-entry="pop"
                                :is-spectator="isSpectator"
                            ></notability>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="col-md-12 segment segment-image mx-0">
            <h2>Reported Beatmaps</h2>
            <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">Date</td>
                    <td scope="col">Mapset</td>
                    <td scope="col">Reason</td>
                    <td scope="col" data-toggle="tooltip" data-placement="top" title="Marks objectivity/subjectivity of issue for reference in BN Evaluations">Notability</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="report in reports" :key="report.id"
                        :class="report.valid == 1 ? 'vote-border-pass-wide' : report.valid == 2 ? 'vote-border-extend-wide' : report.valid == 3 ? 'vote-border-fail-wide' : ''"
                    >
                        <td scope="row">{{new Date(report.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + report.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{report.metadata.length > 50 ? report.metadata.slice(0, 50) + '...' : report.metadata}}
                            </a>
                        </td>
                        <td scope="row">
                            {{report.content.length > 50 ? report.content.slice(0, 50) + '...' : report.content}} 
                            <a href="#" class="float-right" data-toggle="modal" data-target="#editReason" :data-entry="report.id" @click.prevent="selectEntry(report)">edit</a>
                        </td>
                        <td scope="row" style="width: 72px;">
                            <notability
                                :selected-entry="report"
                                :is-spectator="isSpectator"
                            ></notability>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>

    <data-collection-info
        :selected-entry="selectedEntry"
        :is-spectator="isSpectator"
    ></data-collection-info>

</div>

</template>



<script>
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';
import filterLinks from '../mixins/filterLinks.js';
import DataCollectionInfo from '../components/dataCollection/DataCollectionInfo.vue';
import Notability from '../components/dataCollection/Notability.vue';

export default {
    name: 'data-collection-page',
    components: {
        DataCollectionInfo,
        Notability
    },
    mixins: [postData, filters, filterLinks],
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
            this.reports = this.pageObjs.filter(v => v.eventType == 'Reported');
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
    },
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            dqs: null,
            pops: null,
            reports: null,
            selectedEntry: null,
            info: '',
            isSpectator: false,
        }
    },
    created() {
        axios
            .get('/dataCollection/relevantInfo')
            .then(response => {
                this.allObjs = response.data.events;
                this.filterMode = response.data.mode;
                this.isSpectator = response.data.isSpectator;
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
