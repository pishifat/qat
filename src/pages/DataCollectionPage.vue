<template>

<div class="row">
    <div class="col-md-12">
        <section class="segment segment-solid my-1">
            <small
                >Search:
                <input
                    id="search"
                    class="text-input text-input ml-1"
                    v-model="filterValue"
                    type="text"
                    placeholder="beatmap..."
                />
            </small>
            <small class="ml-1">
                <select class="custom-select inline-custom-select" id="mode" v-model="filterMode">
                    <option class="ml-2" value="" selected>All modes</option>
                    <option class="ml-2" value="osu">osu!</option>
                    <option class="ml-2" value="taiko">osu!taiko</option>
                    <option class="ml-2" value="catch">osu!catch</option>
                    <option class="ml-2" value="mania">osu!mania</option>
                </select>
            </small>
            <small class="ml-1">
                <select class="custom-select inline-custom-select" id="validity" v-model="filterVote">
                    <option class="ml-2" value="" selected>All statuses</option>
                    <option class="ml-2" value="1">Valid</option>
                    <option class="ml-2" value="2">Partial</option>
                    <option class="ml-2" value="3">Invalid</option>
                    <option class="ml-2" value="none">Unmarked</option>
                </select>
            </small>
        </section>
        <section class="segment segment-solid mx-0">
            <h2>Disqualifications</h2>
            <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">Date</td>
                    <td scope="col">Mapset</td>
                    <td scope="col">Reason</td>
                    <td scope="col">Validity</td>
                    <td scope="col"></td>
                </thead>
                <tbody>
                    <tr v-for="dq in dqs" :key="dq.id" 
                        :class="dq.valid == 1 ? 'vote-border-pass' : dq.valid == 2 ? 'vote-border-extend' : dq.valid == 3 ? 'vote-border-fail' : ''"
                    >
                        <td scope="row">{{new Date(dq.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion'" target="_blank">{{dq.metadata}}</a>
                        </td>
                        <td scope="row">
                            {{dq.content.slice(0, dq.content.indexOf('.')+1) || dq.content}} 
                            <a href="#" data-toggle="modal" data-target="#editReason" :data-entry="dq.id" @click.prevent="selectEntry(dq)">edit</a>
                            </td>
                        <td scope="row">
                            <a href="#" @click.prevent="updateValidity(dq.id, 1);"
                                data-toggle="tooltip" data-placement="top" title="valid"
                            ><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateValidity(dq.id, 2);"
                                data-toggle="tooltip" data-placement="top" title="partially valid"
                            ><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateValidity(dq.id, 3);"
                                data-toggle="tooltip" data-placement="top" title="invalid"
                            ><i class="fas fa-square vote-fail"></i></a>
                        </td>
                        <td scope="row">
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="col-md-12 segment segment-solid mx-0">
            <h2>Pops</h2>
            <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">Date</td>
                    <td scope="col">Mapset</td>
                    <td scope="col">Reason</td>
                    <td scope="col">Validity</td>
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
                        <td scope="row">
                            <a href="#" @click.prevent="updateValidity(pop.id, 1);"><i class="fas fa-square vote-pass"></i></a>
                            <a href="#" @click.prevent="updateValidity(pop.id, 2);"><i class="fas fa-square vote-extend"></i></a>
                            <a href="#" @click.prevent="updateValidity(pop.id, 3);"><i class="fas fa-square vote-fail"></i></a>
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
                        <p class="text-shadow" for="newReason">New reason: </p>
                        <div class="input-group input-group-sm mb-3">
                            <input class="form-control form-control-sm" type="text" placeholder="Keep it short..." id="newReason" 
                                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 0 0 100px" 
                                @keyup.enter="updateReason($event)" maxlength="50"/>
                            <div class="input-group-append">
                                <button style="border-radius: 0 100px 100px 0;" class="btn btn-nat" @click="updateReason($event)" type="submit"><span class="append-button-padding">Save reason</span></button>
                            </div>
                        </div>
                    </div>
                    <p id="errors">{{info}}</p>
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
            let reason = $("#newReason").val();
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
        }
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
                this.allObjs = response.data;
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
