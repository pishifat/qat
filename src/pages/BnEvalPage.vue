<template>

<div class="row">
    
    <base-eval-page
        is-bn-eval
        
    ></base-eval-page>

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
import BaseEvalPage from './BaseEvalPage.vue';
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import EvalCard from '../components/evaluations/EvalCard.vue';
import EvalInfo from '../components/evaluations/EvalInfo.vue';
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'bn-eval-page',
    components: {
        BaseEvalPage,
        AddEvalRounds,
        EvalCard,
        EvalInfo,
        DiscussCard,
        DiscussInfo
    },
    mixins: [postData],
    watch: {
        filterValue: function(v){
            this.filter();
        },
        filterMode: function(v) {
            this.filter();
        },
    },
    methods: {
        updateEvalRound: function (evalRound) {
			const i = this.allEvalRounds.findIndex(er => er.id == evalRound.id);
			this.allEvalRounds[i] = evalRound;
            this.selectedEvalRound = evalRound;
            this.selectedDiscussRound = evalRound;
            this.filter();
        },
        updateAllEvalRounds: function (evalRounds) {
            this.allEvalRounds = evalRounds;
            this.filter();
		},
        openAddEvalRounds: function() {
            $('input[type=checkbox]').each(function() {
                this.checked = false;
            });
        },
        filter: function () {            
            this.filterValue = $("#search").val();
            this.filterMode = $("#mode").val();
            $("input[name='evalTypeCheck']").prop('checked', false);
            
            //reset
            this.evalRounds = this.allEvalRounds.filter(er => !er.discussion);
            this.discussRounds = this.allEvalRounds.filter(er => er.discussion);

            //search
            if(this.filterValue.length > 2){
                this.filteredEvalRounds = this.allEvalRounds.filter(er => {
                    if(er.bn.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                        return true;
                    }
                    return false;
                });
            }
            
            //mode
            if(this.filterMode.length){
                if(this.filterValue.length > 2){
                    this.filteredEvalRounds = this.filteredEvalRounds.filter(er => {
                        if(this.filterMode == "osu" && er.mode == 'osu') return true;
                        if(this.filterMode == "taiko" && er.mode == 'taiko') return true;
                        if(this.filterMode == "catch" && er.mode == 'catch') return true;
                        if(this.filterMode == "mania" && er.mode == 'mania') return true;
                        return false;
                    });
                }else{
                    this.filteredEvalRounds = this.allEvalRounds.filter(er => {
                        if(this.filterMode == "osu" && er.mode == 'osu') return true;
                        if(this.filterMode == "taiko" && er.mode == 'taiko') return true;
                        if(this.filterMode == "catch" && er.mode == 'catch') return true;
                        if(this.filterMode == "mania" && er.mode == 'mania') return true;
                        return false;
                    });
                }
            }
            
            let isFiltered = (this.filterValue.length > 2 || this.filterMode.length);
            if(isFiltered){
                this.evalRounds = this.filteredEvalRounds.filter(a => !a.discussion);
                this.discussRounds = this.filteredEvalRounds.filter(a => a.discussion);
            }
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
                        this.allEvalRounds = ers;
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
                        this.allEvalRounds = ers;
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
                        this.allEvalRounds = ers;
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
    data() {
        return {
            reports: null,
            allEvalRounds: null,
            filteredEvalRounds: null,

            evalRounds: null,
            selectedEvalRound: null,

            discussRounds: null,
            selectedDiscussRound: null,

            evaluator: null,
            filterMode: '',
            filterValue: '',
            info: '',
        }
    },
    created() {
        axios
            .get('/nat/bnEval/relevantInfo')
            .then(response => {
                this.allEvalRounds = response.data.er;
                this.reports = response.data.r;
                this.evaluator = response.data.evaluator;
                this.filter();
            }).then(function(){
                $("#loading").fadeOut();
                $("#main, footer").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/nat/bnEval/relevantInfo')
                .then(response => {
                    this.allEvalRounds = response.data.er;
                    this.reports = response.data.r;
                });
        }, 300000);
    }
}
</script>