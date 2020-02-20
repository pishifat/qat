<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box 
                :filter-mode.sync="filterMode" 
                :filter-value.sync="filterValue"
                :placeholder="'username... (3+ characters)'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <slot>
                    <button v-if="evaluator && evaluator.isNat" class="btn btn-nat btn-sm ml-2" @click="selectAll($event)">
                        Select all
                    </button>
                </slot>
                <span class="errors">{{ info }}</span>
            </filter-box>
            <section v-if="evaluator && evaluator.isNat" class="row segment my-1 mx-4">
                <div class="small filter-box">
                    <span class="filter-header" style="width: 110px;">Mark selected as</span>
                    <button class="btn btn-nat btn-sm ml-2" @click="setGroupEval($event)">
                        Group evaluation
                    </button>
                    <button class="btn btn-nat btn-sm ml-2" @click="setIndividualEval($event)">
                        Individual evaluation
                    </button>
                    <button
                        class="btn btn-nat-red btn-sm ml-2"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Moves an evaluation to archives and applies its consensus to its user"
                        @click="setComplete($event)"
                    >
                        Archive
                    </button>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="Evaluations are hidden from others to avoid confirmation bias">?</sup> <small v-if="evalRounds">({{ evalRounds.length }})</small>
                        <button
                            v-if="evaluator && evaluator.isLeader"
                            class="btn btn-nat"
                            data-toggle="modal"
                            data-target="#addEvalRounds"
                            @click="openAddEvalRounds()"
                        >
                            Add users to evaluate
                        </button>
                    </h2>
                
                    <transition-group name="list" tag="div" class="row">
                        <current-bn-individual-card
                            v-for="evalRound in evalRounds"
                            :key="evalRound.id"
                            :eval-round="evalRound"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            :user-to-evaluate="evalRound.bn"
                            :mode="evalRound.mode"
                            @update:selected-eval-round="selectedEvalRound = $event"
                        />
                    </transition-group>
                
                    <p v-if="!evalRounds || evalRounds.length == 0" class="ml-4">
                        No BNs to evaluate...
                    </p>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="After individual evals are completed, their responses are made visible to allow discussion between NAT and form a consensus">?</sup> <small v-if="discussRounds">({{ discussRounds.length }})</small></h2>
                
                    <transition-group name="list" tag="div" class="row">
                        <current-bn-discussion-card
                            v-for="evalRound in discussRounds"
                            :key="evalRound.id"
                            :eval-round="evalRound"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            @update:selected-discuss-round="selectedDiscussRound = $event"
                        />
                    </transition-group>
                
                    <p v-if="!discussRounds || discussRounds.length == 0" class="ml-4">
                        No BNs to evaluate...
                    </p>
                </div>
            </section>
        </div>

        <current-bn-individual-info
            :eval-round="selectedEvalRound"
            :evaluator="evaluator"
            @update-eval-round="updateEvalRound($event)"
        />

        <current-bn-discussion-info
            :eval-round="selectedDiscussRound"
            :evaluator="evaluator"
            @update-eval-round="updateEvalRound($event)"
        />

        <add-eval-rounds
            @update-all-eval-rounds="updateAllEvalRounds($event)"
        />
    </div>
</template>

<script>
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import CurrentBnIndividualCard from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualCard.vue';
import CurrentBnIndividualInfo from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualInfo.vue';
import CurrentBnDiscussionCard from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionCard.vue';
import CurrentBnDiscussionInfo from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionInfo.vue';
import FilterBox from '../components/FilterBox.vue';
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvalRounds,
        CurrentBnIndividualCard,
        CurrentBnIndividualInfo,
        CurrentBnDiscussionCard,
        CurrentBnDiscussionInfo,
        FilterBox,
    },
    mixins: [ postData, filters ],
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
            evaluator: null,
            info: '',
        };
    },
    computed: {
        
    },
    created() {
        axios
            .get('/bnEval/relevantInfo')
            .then(response => {
                this.allObjs = response.data.er;
                this.evaluator = response.data.evaluator;
                this.filterMode = response.data.evaluator.modes[0] || 'osu';
                this.hasPagination = false;
                this.hasSeparation = true;
                this.filter();
                const params = new URLSearchParams(document.location.search.substring(1));
                if (params.get('eval') && params.get('eval').length) {
                    const i = this.allObjs.findIndex(a => a.id == params.get('eval'));
                    if(i >= 0){
                        if(!this.allObjs[i].discussion){
                            this.selectedEvalRound = this.allObjs[i];
                            $('#currentBnIndividualInfo').modal('show');
                        }else{
                            this.selectedDiscussRound = this.allObjs[i];
                            $('#currentBnDiscussionInfo').modal('show');
                        }
                    }else{
                        window.location = '/evalArchive?eval=' + params.get('eval');
                    }
                }
            }).then(function(){
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/bnEval/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.er;
                });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(e) {
            if(e.bn.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        separateObjs() {
            this.evalRounds = this.pageObjs.filter(v => !v.discussion);
            this.discussRounds = this.pageObjs.filter(v => v.discussion);
        },
        updateEvalRound (evalRound) {
            const i = this.allObjs.findIndex(er => er.id == evalRound.id);
            this.allObjs[i] = evalRound;
            if(evalRound.discussion){
                this.selectedDiscussRound = evalRound;
            }else{
                this.selectedEvalRound = evalRound;
            }
            this.filter();
        },
        updateAllEvalRounds (evalRounds) {
            this.allObjs = evalRounds;
            this.filter();
        },
        openAddEvalRounds() {
            $('input[type=checkbox]').each(function() {
                this.checked = false;
            });
        },
        async setGroupEval(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const ers = await this.executePost('/bnEval/setGroupEval/', { checkedRounds }, e);
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
        async setIndividualEval(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const ers = await this.executePost('/bnEval/setIndividualEval/', { checkedRounds }, e);
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
        async setComplete(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });
            if(checkedRounds.length){
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);
                if(result){
                    const ers = await this.executePost('/bnEval/setComplete/', { checkedRounds }, e);
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
        selectAll() {
            let checkBoxes = $('input[name=\'evalTypeCheck\'');
            checkBoxes.prop('checked', !checkBoxes.prop('checked'));
            this.allChecked = !this.allChecked;
        },
    },
};
</script>