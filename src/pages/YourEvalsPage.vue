<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
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
                        target="#yourEvalsInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
            </section>

            <section class="card card-body">
                <h2>BN Evaluations</h2>

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
                        target="#yourEvalsInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
            </section>

            <your-evals-info />

            <toast-messages />
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluationsModule from '../store/evaluations';
import ToastMessages from '../components/ToastMessages.vue';
import EvaluationCard from '../components/evaluations/card/EvaluationCard.vue';
import YourEvalsInfo from '../components/evaluations/info/YourEvalsInfo.vue';
import FilterBox from '../components/FilterBox.vue';

export default {
    name: 'YourEvalsPage',
    components: {
        ToastMessages,
        EvaluationCard,
        YourEvalsInfo,
        FilterBox,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters([
            'userMainMode',
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
        if (this.userMainMode) {
            this.$store.commit(`evaluations/pageFilters/setFilterMode`, this.userMainMode);
        }

        const id = this.$route.query.id;
        const query = id ? `?id=${id}` : '';

        const data = await this.$http.initialRequest(`/yourEvals/search${query}`);

        if (data.bnApplications || data.evaluations) {
            this.$store.commit('evaluations/setEvaluations', [...data.evaluations, ...data.bnApplications]);
        }

        if (id) {
            this.$store.commit('evaluations/setSelectedEvaluationId', id);

            if (this.selectedEvaluation) {
                $('#yourEvalsInfo').modal('show');
            } else {
                this.$store.dispatch('updateToastMessages', {
                    message: `Couldn't find the evaluation!`,
                    type: 'danger',
                });
            }
        }
    },
};
</script>
