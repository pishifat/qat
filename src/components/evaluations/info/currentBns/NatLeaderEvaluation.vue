<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <b>Self-reported summary:</b>
                <span v-if="selfSummaryComment" class="small" v-html="$md.render(selfSummaryComment)" />
                <span v-else class="text-secondary">None...</span>
            </div>
        </div>
        <hr>
        <p class="small text-secondary">
            Optional: submit evaluation comments below. The archive buttons apply the final outcome.
        </p>
        <div class="row">
            <reviews-listing class="col-sm-12 mb-4" />
            <evaluation-input class="col-sm-12 mb-4" />
        </div>
        <div class="row">
            <div class="col-sm-4">
                <button
                    class=" btn btn-sm btn-success w-100 "
                    @click="archiveNatEvaluation($event, 'nat')"
                >
                    Archive
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-secondary w-100"
                    @click="archiveNatEvaluation($event, 'bn')"
                >
                    Archive & move from NAT to BN
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-danger w-100"
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
import evaluations from '../../../../mixins/evaluations';
import ReviewsListing from '../common/ReviewsListing.vue';
import EvaluationInput from '../common/EvaluationInput.vue';

export default {
    name: 'NatLeaderEvaluation',
    mixins: [ evaluations ],
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
        selfSummaryComment () {
            return this.getSelfSummaryComment(this.selectedEvaluation);
        },
    },
    methods: {
        async archiveNatEvaluation(e, userGroup) {
            let confirmText = 'Are you sure you want to archive this NAT evaluation?';

            if (userGroup === 'bn') {
                confirmText = 'Are you sure? This will move the user from NAT to BN.';
            } else if (userGroup === 'user') {
                confirmText = 'Are you sure? This will remove the user from NAT.';
            }

            if (!confirm(confirmText)) return;

            const result = await this.$http.executePost(`/bnEval/setComplete/`, { evalIds: [this.selectedEvaluation.id], userGroup }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/setEvaluations', result);
                $('#evaluationInfo').modal('hide');
                this.$router.push(`/evalarchive?id=${this.selectedEvaluation.id}`);
            }
        },
    },
};
</script>
