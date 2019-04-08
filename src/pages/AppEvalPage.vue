<template>

<div class="row">
    <div class="col-md-12">
        <section class="row segment my-1 mx-4">
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
        </section>
        <section class="row segment my-1 mx-4">
            <div class="col-lg-3 mt-1">
                <small>Mark selected as:</small>
            </div>
            <div class="col-lg-3">
                <small>
                    <button class="btn btn-nat btn-sm w-100 mt-1" @click="setGroupEval($event)">Group evaluation</button>
                </small>
            </div>
            <div class="col-lg-3">
                <small>
                    <button class="btn btn-nat btn-sm w-100 mt-1" @click="setIndividualEval($event)">Individual evaluation</button>
                </small>
            </div>
            <div class="col-lg-3">
                <small>
                    <button class="btn btn-nat-red btn-sm w-100 mt-1" @click="setComplete($event)">Archive</button>
                </small>
            </div>
        </section>
        <hr>
        <section class="row segment segment-image mx-1 px-0">
            <div class="col-sm-12">
                <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="only you can see these">?</sup></h2> 

                <transition-group name="list" tag="div" class="row">
                    <eval-card
                        v-for="application in applications"
                        :application="application"
                        :evaluator="evaluator"
                        :all-checked="allChecked"
                        :key="application.id"
                        @update:selectedApplication="selectedApplication = $event"
                    ></eval-card>
                </transition-group>

                <div class="row">
                    <p v-if="!applications || applications.length == 0" class="ml-4">No applications to evaluate...</p>
                </div>
            </div>
        </section>
        <hr>
        <section class="row segment segment-image mx-1 px-0">
            <div class="col-sm-12">
                <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="everyone can see these">?</sup></h2>

                <transition-group name="list" tag="div" class="row">
                    <discuss-card
                        v-for="discussApp in discussApps"
                        :discuss-app="discussApp"
                        :evaluator="evaluator"
                        :all-checked="allChecked"
                        :key="discussApp.id"
                        @update:selectedDiscussApp="selectedDiscussApp = $event"
                    ></discuss-card>
                </transition-group>
                
                <div class="row">
                    <p v-if="!discussApps || discussApps.length == 0" class="ml-4">No applications to evaluate...</p>
                </div>
            </div>
        </section>
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
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'app-eval-page',
    components: {
        EvalCard,
        EvalInfo,
        DiscussCard,
        DiscussInfo
    },
    mixins: [ postData, filters ],
    methods: {
        filterBySearchValueContext: function(a) {
            if(a.applicant.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        separateObjs: function() {
            this.applications = this.pageObjs.filter(v => !v.discussion);
            this.discussApps = this.pageObjs.filter(v => v.discussion);
        },
        updateApplication: function (application) {
			const i = this.allObjs.findIndex(a => a.id == application.id);
			this.allObjs[i] = application;
            this.selectedApplication = application;
            this.selectedDiscussApp = application;
            this.filter();
        },
        setGroupEval: async function(e) {
            let checkedApps = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const ers = await this.executePost('/appEval/setGroupEval/', { checkedApps: checkedApps}, e);
                if (ers) {
                    if (ers.error) {
                        this.info = ers.error;
                    } else {
                        this.allObjs = ers;
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
                const ers = await this.executePost('/appEval/setIndividualEval/', { checkedApps: checkedApps}, e);
                if (ers) {
                    if (ers.error) {
                        this.info = ers.error;
                    } else {
                        this.allObjs = ers;
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
                    const ers = await this.executePost('/appEval/setComplete/', { checkedApps: checkedApps}, e);
                    if (ers) {
                        if (ers.error) {
                            this.info = ers.error;
                        } else {
                            this.allObjs = ers;
                            this.filter();
                        }
                    }
                }
            }
        },
        selectAll: function() {
            var checkBoxes = $("input[name='evalTypeCheck'");
                checkBoxes.prop("checked", !checkBoxes.prop("checked"));
            this.allChecked = !this.allChecked;
        }
    },
    computed: {
        
    },
    data() {
        return {
            allObjs: null,
            filteredObjs: null,
            pageObjs: null,
            applications: null,
            discussApps: null,
            allChecked: false,
            selectedApplication: null,
            selectedDiscussApp: null,
            evaluator: null,
            info: '',
        }
    },
    created() {
        axios
            .get('/appEval/relevantInfo')
            .then(response => {
                this.allObjs = response.data.a;
                this.evaluator = response.data.evaluator;
                this.hasPagination = false;
                this.hasSeparation = true;
                this.filter();
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/appEval/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.a;
                    this.filter();
                });
        }, 300000);
    }
}
</script>