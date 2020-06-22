<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <div class="form-inline">
                    <input
                        v-model="searchValue"
                        type="text"
                        placeholder="username or osuID..."
                        maxlength="18"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="query($event)"
                    >
                    <button class="btn btn-sm btn-primary ml-2" type="submit" @click="query($event)">
                        Search archives
                    </button>
                </div>

                <div class="form-inline mt-2">
                    <input
                        v-model="limit"
                        type="text"
                        placeholder="# entries..."
                        maxlength="3"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="queryRecent($event)"
                    >
                    <button class="btn btn-sm btn-primary ml-2" type="submit" @click="queryRecent($event)">
                        Show recent
                    </button>
                </div>
            </section>

            <section v-if="wasLoaded" class="card card-body">
                <h2>Application Evaluations</h2>

                <transition-group
                    v-if="applications.length"
                    name="list"
                    tag="div"
                    class="row"
                >
                    <evaluation-card
                        v-for="application in applications"
                        :key="application.id"
                        :evaluation="application"
                        store-module="evaluations"
                        target="#evaluationArchiveInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
            </section>

            <section v-if="wasLoaded" class="card card-body">
                <h2>BN Evaluations</h2>

                <transition-group
                    v-if="currentBnsEvaluations.length"
                    name="list"
                    tag="div"
                    class="row"
                >
                    <evaluation-card
                        v-for="evaluation in currentBnsEvaluations"
                        :key="evaluation.id"
                        :evaluation="evaluation"
                        store-module="evaluations"
                        target="#evaluationArchiveInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
            </section>

            <archive-info />

            <toast-messages />
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import postData from '../mixins/postData.js';
import evaluationsModule from '../store/evaluations';
import ToastMessages from '../components/ToastMessages.vue';
import EvaluationCard from '../components/evaluations/card/EvaluationCard.vue';
import ArchiveInfo from '../components/evaluations/info/ArchiveInfo.vue';

export default {
    name: 'EvalArchivePage',
    components: {
        ToastMessages,
        EvaluationCard,
        ArchiveInfo,
    },
    mixins: [postData],
    data() {
        return {
            searchValue: null,
            limit: null,
            wasLoaded: false,
        };
    },
    computed: {
        ...mapState('evaluations', [
            'evaluations',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        applications () {
            return this.evaluations.filter(e => e.kind === 'application');
        },
        currentBnsEvaluations () {
            return this.evaluations.filter(e => e.kind === 'currentBn');
        },
    },
    beforeCreate () {
        if (this.$store.hasModule('evaluations')) {
            this.$store.commit('evaluations/resetState');
        } else {
            this.$store.registerModule('evaluations', evaluationsModule);
        }
    },
    async created() {
        const id = this.$route.query.id;
        const user = this.$route.query.user;
        let query = '';
        query += id ? `id=${id}` : '';
        query += user ? `user=${user}` : '';

        const data = await this.initialRequest(`/evalArchive/search?${query}`);

        if (data.bnApplications || data.evalRounds) {
            this.$store.commit('evaluations/setEvaluations', [...data.evalRounds, ...data.bnApplications]);
            this.wasLoaded = true;
        }

        if (id) {
            this.$store.commit('evaluations/setSelectedEvaluationId', id);

            if (this.selectedEvaluation) {
                $('#evaluationArchiveInfo').modal('show');
            } else {
                this.$store.dispatch('updateToastMessages', {
                    message: `Couldn't find the evaluation!`,
                    type: 'danger',
                });
            }
        }
    },
    methods: {
        async query(e) {
            if (!this.searchValue || !this.searchValue.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must enter username or osu ID!`,
                    type: 'danger',
                });
            } else {
                if (this.$route.query.user !== this.searchValue) {
                    this.$router.replace(`/evalarchive?user=${this.searchValue}`);
                }

                const res = await this.executeGet(`/evalArchive/search?user=${this.searchValue}`, e);

                if (res && !res.error) {
                    this.$store.commit('evaluations/setEvaluations', [...res.bnApplications, ...res.evalRounds]);
                }
            }
        },
        async queryRecent(e) {
            if (!parseInt(this.limit)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Invalid number!`,
                    type: 'danger',
                });
            } else {
                const res = await this.executeGet(`/evalarchive/search?limit=${this.limit}`, e);

                if (res && !res.error) {
                    this.$store.commit('evaluations/setEvaluations', [...res.bnApplications, ...res.evalRounds]);
                }
            }
        },
    },
};
</script>
