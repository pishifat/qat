<template>
    <p class="form-inline">
        <b class="mr-1">Next evaluation:</b>
        <input
            v-if="isEditing"
            v-model="newDeadlineInput"
            class="form-control form-control-sm w-50 mb-2"
            type="text"
            placeholder="new date (yyyy-mm-dd). enter to submit"
            @keyup.enter="overwriteEvaluationDate($event)"
        >

        <span v-else-if="selectedEvaluation.overwriteNextEvaluationDate" :class="consensusColor">
            {{ toStandardDate(selectedEvaluation.overwriteNextEvaluationDate) }}
        </span>

        <span v-else :class="consensusColor">
            {{ estimateText }}
        </span>

        <a
            href="#"
            data-toggle="tooltip"
            data-placement="top"
            title="overwrite next evaluation date"
            class="ml-1"
            @click.prevent="isEditing = !isEditing"
        >
            <i class="fas fa-edit" />
        </a>
    </p>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'NextEvaluationEstimate',
    mixins: [ evaluations ],
    data() {
        return {
            evaluationsWithoutIncident: null,
            skipProbation: false,
            isEditing: false,
            newDeadlineInput: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string} */
        consensus () {
            return this.selectedEvaluation.consensus;
        },
        estimateText () {
            let num;

            if (!this.skipProbation && (this.consensus == 'probationBn' || this.consensus == 'pass' || this.selectedEvaluation.addition == 'lowActivityWarning')) {
                num = 1;
            } else if (this.evaluationsWithoutIncident > 1 && (!this.selectedEvaluation.addition || this.selectedEvaluation.addition == 'none')) {
                num = 6;
            } else {
                num = 3;
            }

            let endText = 's';
            if (num == 1) {
                endText = '';
            }

            return `~${num} month${endText}`;
        }
    },
    watch: {
        async selectedEvaluation () {
            await this.findEstimateInfo();
        },
    },
    async mounted () {
        await this.findEstimateInfo();
    },
    methods: {
        async findEstimateInfo() {
            this.evaluationsWithoutIncident = await this.$http.executeGet(
                `/bnEval/findEvaluationsWithoutIncident/${this.selectedEvaluation.user.id}`
            );

            this.skipProbation = Boolean(await this.$http.executeGet(
                `/bnEval/findSkipProbationEligibility/${this.selectedEvaluation.user.id}/${this.selectedEvaluation.mode}`
            ));
        },
        async overwriteEvaluationDate(e) {
            const result = await this.$http.executePost(
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/overwriteEvaluationDate/` + this.selectedEvaluation.id, { newDeadline: this.newDeadlineInput }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Overwrote next evaluation date`,
                    type: 'success',
                });
                this.isEditing = false;
            }
        },
        toStandardDate (date) {
            if (!date) return '';

            return this.$moment(date).format('YYYY-MM-DD');
        },
    },
};
</script>