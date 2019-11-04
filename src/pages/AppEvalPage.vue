<template>
    <div class="row">
        <p class="errors mx-auto">{{ info }}</p>
        <div class="col-md-12">
            <filter-box 
                :filter-mode.sync="filterMode"
                :filter-value.sync="filterValue"
                :placeholder="'username... (3+ characters)'"
            >
                <slot>
                    <button v-if="evaluator && evaluator.isLeader" class="btn btn-nat btn-sm ml-2" @click="selectAll($event)">
                        Select all
                    </button>
                </slot>
            </filter-box>
            <section v-if="evaluator && evaluator.isLeader" class="row segment my-1 mx-4">
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
                    <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="Evaluations are hidden from others to avoid confirmation bias">?</sup> <small v-if="applications">({{ applications.length }})</small></h2> 

                    <transition-group name="list" tag="div" class="row">
                        <eval-card
                            v-for="application in applications"
                            :key="application.id"
                            :application="application"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            :user-to-evaluate="application.applicant"
                            :mode="application.mode"
                            @update:selectedApplication="selectedApplication = $event"
                        />
                    </transition-group>

                    <div class="row">
                        <p v-if="!applications || applications.length == 0" class="ml-4">
                            No applications to evaluate...
                        </p>
                    </div>
                </div>
            </section>
            <hr v-if="evaluator && (evaluator.group == 'nat' || evaluator.isSpectator)">
            <section v-if="evaluator && (evaluator.group == 'nat' || evaluator.isSpectator)" class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="After individual evals are completed, their responses are made visible to allow discussion and form a consensus">?</sup>
                        <small v-if="discussApps">({{ discussApps.length }})</small>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <discuss-card
                            v-for="discussApp in discussApps"
                            :key="discussApp.id"
                            :discuss-app="discussApp"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            :user-to-evaluate="discussApp.applicant"
                            :mode="discussApp.mode"
                            @update:selectedDiscussApp="selectedDiscussApp = $event"
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

        <eval-info
            :application="selectedApplication"
            :evaluator="evaluator"
            @update-application="updateApplication($event)"
        />

        <discuss-info
            :discuss-app="selectedDiscussApp"
            :evaluator="evaluator"
            @update-application="updateApplication($event)"
        />
    </div>
</template>

<script>
import EvalCard from '../components/evaluations/EvalCard.vue';
import EvalInfo from '../components/evaluations/EvalInfo.vue';
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import FilterBox from '../components/FilterBox.vue';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        EvalCard,
        EvalInfo,
        DiscussCard,
        DiscussInfo,
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
                            $('#evaluationInfo').modal('show');
                        }else{
                            this.selectedDiscussApp = this.allObjs[i];
                            $('#discussionInfo').modal('show');
                        }
                    }else if(this.evaluator.isNat){
                        window.location = "/evalArchive?eval=" + params.get('eval');
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
    watch: {
        selectedApplication() {
            this.info = '';
        },
        selectedDiscussApp() {
            this.info = '';
        },
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
        },
        async setIndividualEval(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });
            if(checkedApps.length){
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