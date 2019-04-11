<template>

<div class="row">
    <div class="col-md-12">
        <section class="row segment my-1 mx-4">
            <div class="d-flex align-items-md-center align-items-stretch flex-md-row flex-column">
                <small>Search: </small>
                <small class="ml-2 mt-1 mt-md-0">
                    <input id="search" v-model="filterValue" type="text" placeholder="username... (3+ characters)" /> 
                </small>
                <small class="ml-2 mt-1 mt-md-0">
                    <select class="custom-select w-100" id="mode" v-model="filterMode">
                        <option value="" selected>All modes</option>
                        <option value="osu">osu!</option>
                        <option value="taiko">osu!taiko</option>
                        <option value="catch">osu!catch</option>
                        <option value="mania">osu!mania</option>
                    </select>
                </small> 
                <small class="ml-2 mt-1 mt-md-0" v-if="evaluator && evaluator.isLeader">
                    <button
                        class="btn btn-nat btn-sm w-100" 
                        @click="selectAll($event)"
                    >Select all</button>
                </small>
            </div>
        </section>
        <section class="row segment my-1 mx-4" v-if="evaluator && evaluator.isLeader">
            <div class="d-flex align-items-md-center align-items-stretch flex-md-row flex-column">
                <small>Mark selected as:</small>
                <small class="ml-2 mt-1 mt-md-0">
                    <button class="btn btn-nat btn-sm w-100" @click="setGroupEval($event)">Group evaluation</button>
                </small>
                <small class="ml-2 mt-1 mt-md-0">
                    <button class="btn btn-nat btn-sm w-100" @click="setIndividualEval($event)">Individual evaluation</button>
                </small>
                <small class="ml-2 mt-1 mt-md-0">
                    <button class="btn btn-nat-red btn-sm w-100" @click="setComplete($event)" data-toggle="tooltip" data-placement="top" title="Moves an evaluation to archives and applies its consensus to its user">Archive</button>
                </small>
            </div>
        </section>
        <hr>
        <section class="row segment segment-image mx-1 px-0">
            <div class="col-sm-12">
                <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="Evaluations are hidden from others to avoid confirmation bias">?</sup> 
                    <button
                        v-if="evaluator && evaluator.isLeader"
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
                        :all-checked="allChecked"
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
        <section class="row segment segment-image mx-1 px-0">
            <div class="col-sm-12">
                <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="After individual evals are completed, their responses are made visible to allow discussion and form a consensus">?</sup></h2>
                
                <transition-group name="list" tag="div" class="row">
                    <discuss-card
                        v-for="discussRound in discussRounds"
                        :discuss-round="discussRound"
                        :evaluator="evaluator"
                        :all-checked="allChecked"
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
        separateObjs: function() {
            this.evalRounds = this.pageObjs.filter(v => !v.discussion);
            this.discussRounds = this.pageObjs.filter(v => v.discussion);
        },
        updateEvalRound: function (evalRound) {
			const i = this.allObjs.findIndex(er => er.id == evalRound.id);
            this.allObjs[i] = evalRound;
            if(evalRound.discussion){
                this.selectedDiscussRound = evalRound;
            }else{
                this.selectedEvalRound = evalRound;
            }
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
                const ers = await this.executePost('/bnEval/setGroupEval/', { checkedRounds: checkedRounds}, e);
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
                const ers = await this.executePost('/bnEval/setIndividualEval/', { checkedRounds: checkedRounds}, e);
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
                if(result){
                    const ers = await this.executePost('/bnEval/setComplete/', { checkedRounds: checkedRounds}, e);
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
            evalRounds: null,
            discussRounds: null,
            selectedEvalRound: null,
            selectedDiscussRound: null,
            allChecked: false,
            reports: null,
            evaluator: null,
            info: '',
        }
    },
    created() {
        axios
            .get('/bnEval/relevantInfo')
            .then(response => {
                this.allObjs = response.data.er;
                this.reports = response.data.r;
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
                .get('/bnEval/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.er;
                    this.reports = response.data.r;
                });
        }, 300000);
    }
}
</script>