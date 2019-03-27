<template>

<div class="row">
    <div class="col-md-12">
        <div class="mb-2">
            <small>Search: 
                <input id="search" class="text-input" v-model="filterValue" type="text" placeholder="username... (3+ characters)" /> 
            </small>
            <small>
                <select class="custom-select inline-custom-select ml-2" id="mode" v-model="filterMode">
                    <option value="" selected>All modes</option>
                    <option value="osu">osu!</option>
                    <option value="taiko">osu!taiko</option>
                    <option value="catch">osu!catch</option>
                    <option value="mania">osu!mania</option>
                </select>
            </small>
            <small>
                <button class="btn btn-nat btn-sm ml-2" @click="selectAll($event)">Select all</button>
            </small>
        </div>
        <div class="mb-2">
            <small>Mark selected as:
                <button class="btn btn-nat btn-sm ml-2" @click="setGroupEval($event)">Group evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat btn-sm ml-2" @click="setIndividualEval($event)">Individual evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat-red btn-sm ml-2" @click="setComplete($event)">Archive</button>
            </small>
        </div>
        <hr>
        <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="only you can see these">?</sup></h2> 
        <transition-group name="list" tag="div" class="row">
            <eval-card
                v-for="application in applications"
                :application="application"
                :evaluator="evaluator"
                :key="application.id"
                @update:selectedApplication="selectedApplication = $event"
            ></eval-card>
        </transition-group>
        <p v-if="!applications || applications.length == 0" class="ml-4">No applications to evaluate...</p>
    </div>

    <div class="col-md-12 mt-4">
        <hr>
        <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="everyone can see these">?</sup></h2>
        <transition-group name="list" tag="div" class="row">
            <discuss-card
                v-for="discussApp in discussApps"
                :discuss-app="discussApp"
                :evaluator="evaluator"
                :key="discussApp.id"
                @update:selectedDiscussApp="selectedDiscussApp = $event"
            ></discuss-card>
        </transition-group>
        
        <p v-if="!discussApps || discussApps.length == 0" class="ml-4">No applications to evaluate...</p>
    </div>

    <eval-info
        :application="selectedApplication"
        :evaluator="evaluator"
        @update-application="updateApplication($event)"
    ></eval-info>

    <discuss-info
        :discussApp="selectedDiscussApp"
        :evaluator="evaluator"
        @update-application="updateApplication($event)"
    ></discuss-info>

</div>

</template>

<script>
import EvalCard from '../components/evaluations/EvalCard.vue';
import EvalInfo from '../components/evaluations/EvalInfo.vue';
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'app-eval-page',
    components: {
        EvalCard,
        EvalInfo,
        DiscussCard,
        DiscussInfo
    },
    mixins: [postData],
    watch: {
        filterValue: function(){
            this.filter();
        },
        filterMode: function() {
            this.filter();
        },
    },
    methods: {
        updateApplication: function (application) {
			const i = this.allApplications.findIndex(a => a.id == application.id);
			this.allApplications[i] = application;
            this.selectedApplication = application;
            this.selectedDiscussApp = application;
            this.filter();
        },
        filter: function () {            
            this.filterValue = $("#search").val();
            this.filterMode = $("#mode").val();
            $("input[name='evalTypeCheck']").prop('checked', false);
            
            //reset
            this.applications = this.allApplications.filter(a => !a.discussion);
            this.discussApps = this.allApplications.filter(a => a.discussion);

            //search
            if(this.filterValue.length > 2){
                this.filteredApps = this.allApplications.filter(a => {
                    if(a.applicant.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) return true;
                    return false;
                });
            }
            
            //mode
            if(this.filterMode.length){
                if(this.filterValue.length > 2){
                    this.filteredApps = this.filteredApps.filter(a => {
                        if(this.filterMode == "osu" && a.mode == 'osu') return true;
                        if(this.filterMode == "taiko" && a.mode == 'taiko') return true;
                        if(this.filterMode == "catch" && a.mode == 'catch') return true;
                        if(this.filterMode == "mania" && a.mode == 'mania') return true;
                        return false;
                    });
                }else{
                    this.filteredApps = this.allApplications.filter(a => {
                        if(this.filterMode == "osu" && a.mode == 'osu') return true;
                        if(this.filterMode == "taiko" && a.mode == 'taiko') return true;
                        if(this.filterMode == "catch" && a.mode == 'catch') return true;
                        if(this.filterMode == "mania" && a.mode == 'mania') return true;
                        return false;
                    });
                }
            }

            let isFiltered = (this.filterValue.length > 2 || this.filterMode.length);
            if(isFiltered){
                this.applications = this.filteredApps.filter(a => !a.discussion);
                this.discussApps = this.filteredApps.filter(a => a.discussion);
            }
        },
        setGroupEval: async function(e) {
            let checkedApps = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const ers = await this.executePost('/nat/appEval/setGroupEval/', { checkedApps: checkedApps}, e);
                if (ers) {
                    if (ers.error) {
                        this.info = ers.error;
                    } else {
                        this.allApplications = ers;
                        this.filter();
                    }
                }
            }
        },
        setIndividualEval: async function(e) {
            let checkedApps = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const ers = await this.executePost('/nat/appEval/setIndividualEval/', { checkedApps: checkedApps}, e);
                if (ers) {
                    if (ers.error) {
                        this.info = ers.error;
                    } else {
                        this.allApplications = ers;
                        this.filter();
                    }
                }
            }
        },
        setComplete: async function(e) {
            let checkedApps = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);
                if(result){
                    const ers = await this.executePost('/nat/appEval/setComplete/', { checkedApps: checkedApps}, e);
                    if (ers) {
                        if (ers.error) {
                            this.info = ers.error;
                        } else {
                            this.allApplications = ers;
                            this.filter();
                        }
                    }
                }
            }
        },
        selectAll: function() {
            var checkBoxes = $("input[name='evalTypeCheck'");
                checkBoxes.prop("checked", !checkBoxes.prop("checked"));
        }
    },
    data() {
        return {
            allApplications: null,
            filteredApps: null,

            applications: null,
            selectedApplication: null,

            discussApps: null,
            selectedDiscussApp: null,
            
            evaluator: null,
            info: '',
            filterValue: '',
            filterMode: '',
        }
    },
    created() {
        axios
            .get('/nat/appEval/relevantInfo')
            .then(response => {
                this.allApplications = response.data.a;
                this.evaluator = response.data.evaluator;
                this.filter();
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/nat/appEval/relevantInfo')
                .then(response => {
                    this.allApplications = response.data.a;
                    this.filter();
                });
        }, 300000);
    }
}
</script>