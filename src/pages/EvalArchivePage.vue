<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <div v-if="loggedInUser.isNat" class="form-inline">
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

                <div v-if="loggedInUser.isNat" class="form-inline mt-2">
                    <input
                        v-model="limit"
                        type="text"
                        placeholder="# entries..."
                        maxlength="3"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="queryRecent($event)"
                    >

                    <select
                        v-model="mode"
                        class="form-control ml-1"
                        @change="findNatActivity($event)"
                    >
                        <option class="ml-2" value="osu" selected>
                            osu!
                        </option>
                        <option class="ml-2" value="taiko">
                            osu!taiko
                        </option>
                        <option class="ml-2" value="catch">
                            osu!catch
                        </option>
                        <option class="ml-2" value="mania">
                            osu!mania
                        </option>
                    </select>

                    <button class="btn btn-sm btn-primary ml-2" type="submit" @click="queryRecent($event)">
                        Show recent
                    </button>
                </div>
                <div class="form-inline mt-2">
                    <input
                        v-model="participatedSearchValue"
                        type="text"
                        placeholder="username or osuID..."
                        maxlength="18"
                        autocomplete="off"
                        class="form-control"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="leave text field empty to load all users" 
                        @keyup.enter="queryParticipatedEvals($event)"
                    >
                    <button 
                        class="btn btn-sm btn-primary ml-2" 
                        type="submit" 
                        
                        @click="queryParticipatedEvals($event)"
                        >
                        Show evals you've participated in
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
                <h2>BN/NAT Evaluations</h2>

                <transition-group
                    v-if="currentBnEvaluations.length"
                    name="list"
                    tag="div"
                    class="row"
                >
                    <evaluation-card
                        v-for="evaluation in currentBnEvaluations"
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
    data() {
        return {
            searchValue: null,
            participatedSearchValue: '',
            limit: null,
            wasLoaded: false,
            mode: 'osu',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('evaluations', [
            'evaluations',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {Array} */
        applications () {
            return this.evaluations.filter(e => e.isApplication);
        },
        /** @returns {Array} */
        currentBnEvaluations () {
            return this.evaluations.filter(e => e.isBnEvaluation || e.isResignation);
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
        if (this.loggedInUser.isNat) {
            const id = this.$route.query.id;
            const user = this.$route.query.user;
            let query = '';
            query += id ? `id=${id}` : '';
            query += user ? `user=${user}` : '';

            const data = await this.$http.initialRequest(`/evalArchive/search?${query}`);

            if (data.bnApplications || data.evaluations) {
                this.$store.commit('evaluations/setEvaluations', [...data.evaluations, ...data.bnApplications]);
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
        } else this.wasLoaded = true;
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

                const res = await this.$http.executeGet(`/evalArchive/search?user=${this.searchValue}`, e);

                if (res && !res.error) {
                    this.$store.commit('evaluations/setEvaluations', [...res.bnApplications, ...res.evaluations]);
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
                const res = await this.$http.executeGet(`/evalarchive/search?limit=${this.limit}&mode=${this.mode}`, e);

                if (res && !res.error) {
                    this.$store.commit('evaluations/setEvaluations', [...res.bnApplications, ...res.evaluations]);
                }
            }
        },
        async queryParticipatedEvals(e) {
            const res = await this.$http.executeGet(`/evalarchive/participatedEvals?user=${this.participatedSearchValue}`, e);

            if (res && !res.error) {
                this.$store.commit('evaluations/setEvaluations', [...res.bnApplications, ...res.evaluations]);
            }
        },
    },
};
</script>
