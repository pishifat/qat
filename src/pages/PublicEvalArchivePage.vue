
<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                :groups="null"
                store-module="evaluations"
            >
                <select
                    v-model="consensusFilter"
                    class="form-control"
                    @change="applyConsensusFilter($event.target.value)"
                >
                    <option value="">
                        Any consensus
                    </option>
                    <option value="pass">
                        Pass
                    </option>
                    <option value="fail">
                        Fail
                    </option>
                    <option value="fullBn">
                        Full BN
                    </option>
                    <option value="probationBn">
                        Probation BN
                    </option>
                    <option value="removeFromBn">
                        Remove From BN
                    </option>
                </select>
                <div v-if="!reachedMax" class="row">
                    <div class="col-sm-6">
                        <button
                            type="button"
                            class="mt-2 form-control btn btn-primary btn-sm"
                            @click="showMore($event)"
                        >
                            Show more
                        </button>
                    </div>
                    <div class="col-sm-6">
                        <button
                            type="button"
                            class="mt-2 form-control btn btn-secondary btn-sm"
                            @click="showAll($event)"
                        >
                            Show all
                        </button>
                    </div>
                </div>
            </filter-box>

            <section class="card card-body">
                <h2>
                    Application Evaluations
                    <small v-if="archivedApplications">
                        ({{ filterEvals(archivedApplications, consensusFilter).length + (reachedMax ? '' : '+') }})
                    </small>
                </h2>
                <span v-if="!filterEvals(archivedApplications, consensusFilter).length" class="ml-4">
                    None...
                </span>
                <transition-group name="list" tag="div" class="row">
                    <template v-if="filterEvals(paginatedArchivedApplications, consensusFilter)">
                        <evaluation-card
                            v-for="application in filterEvals(paginatedArchivedApplications, consensusFilter)"
                            key="applications-card"
                            :key="application._id"
                            :evaluation="application"
                            store-module="evaluations"
                            target="#extendedInfo"
                        />
                    </template>
                    <span v-else key="applications-none" class="small">
                        None...
                    </span>
                </transition-group>
                <pagination-nav store-module="evaluations" type="applications" />
            </section>

            <section class="card card-body">
                <h2>
                    BN Evaluations
                    <small v-if="archivedCurrentBnEvals">
                        ({{ filterEvals(archivedCurrentBnEvals, consensusFilter).length + (reachedMax ? '' : '+') }})
                    </small>
                </h2>
                <span v-if="!filterEvals(archivedCurrentBnEvals, consensusFilter).length" class="ml-4">
                    None...
                </span>
                <transition-group name="list" tag="div" class="row">
                    <template v-if="filterEvals(paginatedArchivedCurrentBnEvals, consensusFilter).length">
                        <evaluation-card
                            v-for="evaluation in filterEvals(paginatedArchivedCurrentBnEvals, consensusFilter)"
                            key="bn-evals-card"
                            :key="evaluation._id"
                            :evaluation="evaluation"
                            store-module="evaluations"
                            target="#extendedInfo"
                        />
                    </template>
                    <span v-else key="bn-evals-none" class="small">
                        None...
                    </span>
                </transition-group>
                <pagination-nav store-module="evaluations" type="evaluations" />
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
import PaginationNav from '../components/PaginationNav.vue';

export default {
    name: 'PublicEvalArchivePage',
    components: {
        ToastMessages,
        EvaluationCard,
        PublicEvalsInfo,
        FilterBox,
        PaginationNav,
    },
    data() {
        return {
            skip: 48,
            limit: 48,
            reachedMax: false,
            consensusFilter: '',
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
            'paginatedArchivedApplications',
            'paginatedArchivedCurrentBnEvals',
        ]),
    },
    watch: {
        archivedApplications(v) {
            this.$store.dispatch('evaluations/evalPagination/updateArchivedAppsMaxPages', v.length);
        },
        archivedCurrentBnEvals(v) {
            this.$store.dispatch('evaluations/evalPagination/updateArchivedCurrentBnEvalsMaxPages', v.length);
        },
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
            if (!consensus.length) return evals;

            return evals.filter(e => e.consensus === consensus);
        },
        applyConsensusFilter(consensus) {
            this.consensusFilter = consensus;
            this.$store.commit('evaluations/pageFilters/setFilterConsensus', consensus);
        },
    },
};
</script>
