<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <h2>
                    Application Evaluations
                    <small>({{ applications.length }})</small>
                </h2>
                
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
                        target="#extendedInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
            </section>

            <section class="card card-body">
                <h2>
                    BN Evaluations
                    <small>({{ currentBnEvaluations.length }})</small>
                </h2>

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
                        target="#extendedInfo"
                    />
                </transition-group>

                <p v-else class="ml-4">
                    None...
                </p>
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

export default {
    name: 'YourEvalsPage',
    components: {
        ToastMessages,
        EvaluationCard,
        PublicEvalsInfo,
    },
    computed: {
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
        const id = this.$route.query.id;
        const query = id ? `?id=${id}` : '';

        const data = await this.$http.initialRequest(`/yourEvals/search${query}`);

        if (data.bnApplications || data.evaluations) {
            this.$store.commit('evaluations/setEvaluations', [...data.evaluations, ...data.bnApplications]);
        }

        if (id) {
            this.$store.commit('evaluations/setSelectedEvaluationId', id);

            if (this.selectedEvaluation) {
                $('#extendedInfo').modal('show');
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
