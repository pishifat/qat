<template>

<div class="row">
    <div class="col-md-12">
        <section class="row segment segment-solid my-1 mx-4">
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
        <section class="row segment segment-solid my-1 mx-4">
            <small>Mark selected as:
                <button class="btn btn-nat btn-sm ml-2" @click="setGroupEval($event)">Group evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat btn-sm ml-2" @click="setIndividualEval($event)">Individual evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat-red btn-sm ml-2" @click="setComplete($event)">Archive</button>
            </small>
        </section>
        <hr>
        <section class="row segment mx-1 px-0">
            <div class="col-sm-12">
                <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="only you can see these">?</sup> 
                    <button
                        class="btn btn-nat"
                        data-toggle="modal"
                        data-target="#addEvalRounds"
                        @click="openAddEvalRounds()"
                    >Add users to evaluate</button>
                </h2>
                
                <transition-group name="list" tag="div" class="row">
                    <eval-card
                        v-for="evalRound in evalRounds"
                        :eval-round="evalRound"
                        :evaluator="evaluator"
                        :key="evalRound.id"
                        @update:selectedEvalRound="selectedEvalRound = $event"
                    ></eval-card>
                </transition-group>
                
                <p v-if="!evalRounds || evalRounds.length == 0" class="ml-4">
                    No BNs to evaluate...
                </p>
            </div>
        </section>
        <hr>
        <section class="row segment mx-1 px-0">
            <div class="col-sm-12">
                <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="everyone can see these">?</sup></h2>
                
                <transition-group name="list" tag="div" class="row">
                    <discuss-card
                        v-for="discussRound in discussRounds"
                        :discuss-round="discussRound"
                        :evaluator="evaluator"
                        :key="discussRound.id"
                        @update:selectedDiscussRound="selectedDiscussRound = $event"
                    ></discuss-card>
                </transition-group>
                
                <p v-if="!discussRounds || discussRounds.length == 0" class="ml-4">
                    No BNs to evaluate...
                </p>
            </div>
        </section>
    </div>
    

    <eval-info
        :evalRound="selectedEvalRound"
        :evaluator="evaluator"
        :reports="reports"
        @update-eval-round="updateEvalRound($event)"
    ></eval-info>

    <discuss-info
        :discussRound="selectedDiscussRound"
        :evaluator="evaluator"
        :reports="reports"
        @update-eval-round="updateEvalRound($event)"
    ></discuss-info>

    <add-eval-rounds
        @update-all-eval-rounds="updateAllEvalRounds($event)"
    ></add-eval-rounds>

</div>

</template>

<script>
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import EvalCard from '../components/evaluations/EvalCard.vue';
import EvalInfo from '../components/evaluations/EvalInfo.vue';
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';

export default {
    name: 'bn-eval-page',
    components: {
        AddEvalRounds,
        EvalCard,
        EvalInfo,
        DiscussCard,
        DiscussInfo
    },
    mixins: [ postData, filters ],
    methods: {
        filterBySearchValueContext: function(e) {
            if(e.bn.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        updateEvalRound: function (evalRound) {
			const i = this.allObjs.findIndex(er => er.id == evalRound.id);
			this.allObjs[i] = evalRound;
            this.selectedEvalRound = evalRound;
            this.selectedDiscussRound = evalRound;
            this.filter();
        },
        updateAllEvalRounds: function (evalRounds) {
            this.allObjs = evalRounds;
            this.filter();
		},
        openAddEvalRounds: function() {
            $('input[type=checkbox]').each(function() {
                this.checked = false;
            });
        },
        setGroupEval: async function(e) {
            let checkedRounds = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const ers = await this.executePost('/nat/bnEval/setGroupEval/', { checkedRounds: checkedRounds}, e);
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
            let checkedRounds = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const ers = await this.executePost('/nat/bnEval/setIndividualEval/', { checkedRounds: checkedRounds}, e);
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
            let checkedRounds = [];
            $("input[name='evalTypeCheck']:checked").each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);
                const ers = await this.executePost('/nat/bnEval/setComplete/', { checkedRounds: checkedRounds}, e);
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
        selectAll: function() {
            var checkBoxes = $("input[name='evalTypeCheck'");
                checkBoxes.prop("checked", !checkBoxes.prop("checked"));
        }
    },
    computed: {
        evalRounds: function() {
            if (this.pageObjs) {
                return this.pageObjs.filter(e => {
                    return !e.discussion
                });
            }
        },
        discussRounds: function() {
            if (this.pageObjs) {
                return this.pageObjs.filter(e => {
                    return e.discussion
                });
            }
        },
    },
    data() {
        return {
            allObjs: null,
            filteredObjs: null,
            pageObjs: null,
            selectedEvalRound: null,
            selectedDiscussRound: null,
            reports: null,
            evaluator: null,
            info: '',
        }
    },
    created() {
        axios
            .get('/nat/bnEval/relevantInfo')
            .then(response => {
                this.allObjs = response.data.er;
                this.reports = response.data.r;
                this.evaluator = response.data.evaluator;
                this.hasPagination = false;
                this.filter();
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/nat/bnEval/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.er;
                    this.reports = response.data.r;
                });
        }, 300000);
    }
}
</script>