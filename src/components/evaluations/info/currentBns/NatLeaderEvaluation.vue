<template>
    <div>
        <div class="row">
            <p class="col-sm-12" v-if="selectedEvaluation.user.rerolledEvaluationCount">
                <b>Re-assigned evaluations:</b>
                {{ selectedEvaluation.user.rerolledEvaluationCount }}
            </p>
            <div class="col-sm-12">
                <b>Self-reported summary:</b>
                <span v-if="selectedEvaluation.selfSummary" class="small" v-html="$md.render(selectedEvaluation.selfSummary.comment)" />
                <span v-else class="text-secondary">None...</span>
            </div>
        </div>
        <hr />
        <div class="row">
            <reviews-listing class="col-sm-12 mb-4" />
            <evaluation-input class="col-sm-12 mb-4" />
        </div>
        <div class="row">
            <div class="col-sm-4">
                <button
                    class=" btn btn-sm btn-success btn-block "
                    @click="archiveNatEvaluation($event, 'nat')"
                >
                    Archive
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-secondary btn-block"
                    @click="archiveNatEvaluation($event, 'bn')"
                >
                    Archive & move from NAT to BN
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-danger btn-block"
                    @click="archiveNatEvaluation($event, 'user')"
                >
                    Archive & remove from NAT
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ReviewsListing from '../common/ReviewsListing.vue';
import EvaluationInput from '../common/EvaluationInput.vue';

export default {
    name: 'NatLeaderEvaluation',
    components: {
        EvaluationInput,
        ReviewsListing,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    methods: {
        async archiveNatEvaluation(e, userGroup) {
            await this.$http.executePost(`/bnEval/setComplete/`, { evalIds: [this.selectedEvaluation.id], userGroup }, e);
            $('#evaluationInfo').modal('hide');
            this.$router.push(`/evalarchive?id=${this.selectedEvaluation.id}`);
        },
    },
};
</script>