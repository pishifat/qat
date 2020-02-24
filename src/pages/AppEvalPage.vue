<template>
    <div class="row">
        <p class="errors mx-auto">
            {{ info }}
        </p>
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
            <evaluation-instructions />
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="Evaluations are hidden from others to avoid confirmation bias">?</sup> <small v-if="applications">({{ applications.length }})</small></h2> 

                    <transition-group name="list" tag="div" class="row">
                        <application-individual-card
                            v-for="application in applications"
                            :key="application.id"
                            :application="application"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            :user-to-evaluate="application.applicant"
                            :mode="application.mode"
                            @update:selected-application="selectedApplication = $event"
                        />
                    </transition-group>

                    <div class="row">
                        <p v-if="!applications || applications.length == 0" class="ml-4">
                            No applications to evaluate...
                        </p>
                    </div>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        {{ evaluator && evaluator.isNat ? 'Group Evaluations' : 'Completed Evaluations' }}<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" :title="evaluator && evaluator.isNat ? 'After individual evals are completed, their responses are made visible to allow discussion and form a consensus' : 'Results of archived evaluations you were assigned to'">?</sup>
                        <small v-if="discussApps">({{ discussApps.length }})</small>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <application-discussion-card
                            v-for="application in discussApps"
                            :key="application.id"
                            :application="application"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            @update:selected-application="selectedDiscussApp = $event"
                        />
                    </transition-group>
                
                    <div class="row">
                        <p v-if="!discussApps || discussApps.length == 0" class="ml-4">
                            No applications to evaluate...
                        </p>
                    </div>
                </div>
            </section>
        </div>

        <application-individual-info
            :application="selectedApplication"
            :evaluator="evaluator"
            @update-application="updateApplication($event)"
        />

        <application-discussion-info
            :application="selectedDiscussApp"
            :evaluator="evaluator"
            @update-application="updateApplication($event)"
        />
    </div>
</template>

<script>
import ApplicationIndividualCard from '../components/evaluations/applications/ApplicationIndividualCard.vue';
import ApplicationIndividualInfo from '../components/evaluations/applications/ApplicationIndividualInfo.vue';
import ApplicationDiscussionCard from '../components/evaluations/applications/ApplicationDiscussionCard.vue';
import ApplicationDiscussionInfo from '../components/evaluations/applications/ApplicationDiscussionInfo.vue';
import EvaluationInstructions from '../components/evaluations/applications/EvaluationInstructions.vue';
import FilterBox from '../components/FilterBox.vue';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        ApplicationIndividualCard,
        ApplicationIndividualInfo,
        ApplicationDiscussionCard,
        ApplicationDiscussionInfo,
        EvaluationInstructions,
        FilterBox,
    },
    mixins: [ postData, filters ],
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
        };
    },
    watch: {
        selectedApplication() {
            this.info = '';
        },
        selectedDiscussApp() {
            this.info = '';
        },
    },
    created() {
        axios
            .get('/appEval/relevantInfo')
            .then(response => {
                this.allObjs = response.data.a;
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
                            this.selectedApplication = this.allObjs[i];
                            $('#applicationIndividualInfo').modal('show');
                        }else{
                            this.selectedDiscussApp = this.allObjs[i];
                            $('#applicationDiscussionInfo').modal('show');
                        }
                    }else if(this.evaluator.isNat){
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
                .get('/appEval/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.a;
                    this.filter();
                });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(a) {
            if(a.applicant.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        separateObjs() {
            this.applications = this.pageObjs.filter(v => !v.discussion);
            this.discussApps = this.pageObjs.filter(v => v.discussion);
        },
        updateApplication (application) {
            const i = this.allObjs.findIndex(a => a.id == application.id);
            this.allObjs[i] = application;
            if(application.discussion){
                this.selectedDiscussApp = application;
            }else{
                this.selectedApplication = application;
            }
            this.filter();
        },
        async setGroupEval(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const result = confirm(`Are you sure?`);
                if (result) {
                    const ers = await this.executePost('/appEval/setGroupEval/', { checkedApps }, e);
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
        async setIndividualEval(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const result = confirm(`Are you sure?`);
                if (result) {
                    const ers = await this.executePost('/appEval/setIndividualEval/', { checkedApps }, e);
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
        async setComplete(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);
                if(result){
                    const ers = await this.executePost('/appEval/setComplete/', { checkedApps }, e);
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