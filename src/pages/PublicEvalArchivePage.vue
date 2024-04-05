
<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                :groups="null"
                store-module="evaluations"
            >
            <div v-if="!reachedMax" class="mt-2">
                <button
                    type="button"
                    class="btn btn-primary btn-sm float-left"
                    @click="showMore($event)"
                >
                    Show more
                </button>
                <button
                    type="button"
                    class="btn btn-secondary btn-sm ml-2 float-left"
                    @click="showAll($event)"
                >
                    Show all
                </button>
            </div>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Application Evaluations
                    <small v-if="archivedApplications">
                        ({{ filterEvals(archivedApplications, appConsensusFilter).length + (reachedMax ? '' : '+')}})
                    </small>
                </h2>
                <div class="mt-2">
                    Consensus:
                        <div class="ml-2 btn-group">
                            <button
                                type="button"
                                class="btn btn-sm btn-info ml-2"
                                @click="appConsensusFilter = null"
                                :disabled="appConsensusFilter === null"
                            >
                                Any
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-success"
                                @click="appConsensusFilter = 'pass'"
                                :disabled="appConsensusFilter === 'pass'"
                            >
                                Pass
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-danger"
                                @click="appConsensusFilter = 'fail'"
                                :disabled="appConsensusFilter === 'fail'"
                            >
                                Fail
                            </button>
                        </div>
                    </div>
                <hr>
                <span v-if="!filterEvals(archivedApplications, appConsensusFilter).length" class="ml-4">
                    None...
                </span>
                <transition-group name="list" tag="div" class="row">
                    <evaluation-card
                        v-if="filterEvals(archivedApplications, appConsensusFilter)"
                        v-for="application in filterEvals(archivedApplications, appConsensusFilter)"
                        :key="application._id"
                        :evaluation="application"
                        store-module="evaluations"
                        target="#extendedInfo"
                    />
                    <span v-else class="small">
                        None...
                    </span>
                </transition-group>
                
            </section>

            <section class="card card-body">
                <h2>
                    BN Evaluations
                    <small v-if="archivedCurrentBnEvals">
                        ({{ filterEvals(archivedCurrentBnEvals, bnEvalConsensusFilter).length + (reachedMax ? '' : '+')}})
                    </small>
                </h2>
                <div class="mt-2">
                    Consensus:
                    <div class="ml-2 btn-group">
                        <button
                            type="button"
                            class="btn btn-sm btn-info ml-2"
                            @click="bnEvalConsensusFilter = null"
                            :disabled="bnEvalConsensusFilter === null"
                        >
                            Any
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-success"
                            @click="bnEvalConsensusFilter = 'fullBn'"
                            :disabled="bnEvalConsensusFilter === 'fullBn'"
                        >
                            Full BN
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-probation"
                            @click="bnEvalConsensusFilter = 'probationBn'"
                            :disabled="bnEvalConsensusFilter === 'probationBn'"
                        >
                            Probation BN
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            @click="bnEvalConsensusFilter = 'removeFromBn'"
                            :disabled="bnEvalConsensusFilter === 'removeFromBn'"
                        >
                            Remove From BN
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            @click="bnEvalConsensusFilter = 'resignedOnGoodTerms'"
                            :disabled="bnEvalConsensusFilter === 'resignedOnGoodTerms'"
                        >
                            Resigned on Good Terms
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="bnEvalConsensusFilter = 'resignedOnStandardTerms'"
                            :disabled="bnEvalConsensusFilter === 'resignedOnStandardTerms'"
                        >
                            Resigned on Standard Terms
                        </button>
                    </div>
                </div>
                <hr>
                <span v-if="!filterEvals(archivedCurrentBnEvals, bnEvalConsensusFilter).length" class="ml-4">
                    None...
                </span>
                <transition-group name="list"tag="div"class="row">
                    <evaluation-card
                        v-if="filterEvals(archivedCurrentBnEvals, bnEvalConsensusFilter).length"
                        v-for="evaluation in filterEvals(archivedCurrentBnEvals, bnEvalConsensusFilter)"
                        :key="evaluation._id"
                        :evaluation="evaluation"
                        store-module="evaluations"
                        target="#extendedInfo"
                    />
                </transition-group>
            </section>

            <public-evals-info />
            <toast-messages />
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluationsModule from '../store/evaluations';
import ToastMessages from '../components/ToastMessages.vue';
import EvaluationCard from '../components/evaluations/card/EvaluationCard.vue';
import PublicEvalsInfo from '../components/evaluations/info/PublicEvalsInfo.vue';
import FilterBox from '../components/FilterBox.vue';

export default {
    name: 'PublicEvalArchivePage',
    components: {
        ToastMessages,
        EvaluationCard,
        PublicEvalsInfo,
        FilterBox,
    },
    data() {
        return {
            skip: 24,
            limit: 24,
            reachedMax: false,
            appConsensusFilter: null,
            bnEvalConsensusFilter: null,
        };
    },
    computed: {
        ...mapState('evaluations', [
            'evaluations',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'archivedApplications',
            'archivedCurrentBnEvals',
        ]),
    },
    beforeCreate() {
        if (this.$store.hasModule('evaluations')) {
            this.$store.commit('evaluations/resetState');
            this.$store.commit('evaluations/pageFilters/resetFilters');
        } else {
            this.$store.registerModule('evaluations', evaluationsModule);
        }
    },
    async created() {
        const id = this.$route.query.id;

        if (!id) await this.showMore(null, true);
        
        else {
            const res = await this.$http.initialRequest(
                `/publicArchive/search/${id}`
            );

            if (this.$http.isValid(res)) {
                this.$store.commit('evaluations/setEvaluations', [res.eval]);
                this.$store.commit('evaluations/setSelectedEvaluationId', res.eval.id);
                if (this.selectedEvaluation) {
                    $('#extendedInfo').modal('show');
                } else {
                    this.$store.dispatch('updateToastMessages', {
                        message: `Couldn't find the evaluation!`,
                        type: 'danger',
                    });
            }
            } else {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Application not found',
                    type: 'danger',
                });
            }
        }
    },
    methods: {
        async showMore(e, firstLoad) {
            this.limit += this.skip;

            const startEvaluationsCount = this.evaluations.length;

            let data;

            if (firstLoad) {
                data = await this.$http.initialRequest(
                    `/publicArchive/relevantInfo/${this.limit}`
                );
            } else {
                data = await this.$http.executeGet(
                    `/publicArchive/relevantInfo/${this.limit}`,
                    e
                );
            }

            if (data.applications) {
                this.$store.commit('evaluations/setEvaluations', [...data.applications, ...data.bnEvaluations]);

                if ([...data.applications, ...data.bnEvaluations].length == startEvaluationsCount || [...data.applications, ...data.bnEvaluations].length < this.skip) {
                    this.reachedMax = true;
                }
            }
        },
        async showAll(e) {
            const result = confirm(`Are you sure? This will take a while.`);
            if (result) {
                this.limit = 10000;
                this.reachedMax = true;
                await this.showMore(e);
            }
        },
        filterEvals(evals, consensus) {
            if (consensus === null) return evals;
            return evals.filter(e => e.consensus === consensus);
        },
    },
};

</script>
