<template>
    <current-bn-info
        id="currentBnIndividualInfo"
        :evaluation="selectedIndividualRound"
    >
        <template #additional-info>
            <user-list
                v-if="selectedIndividualRound.evaluations.length"
                :header="'Total evaluations: (' + selectedIndividualRound.evaluations.length + ')'"
                :user-list="submittedEvaluators"
            />
            <evaluator-assignments
                :nat-evaluators="selectedIndividualRound.natEvaluators"
                :evaluations="selectedIndividualRound.evaluations"
                :mode="selectedIndividualRound.mode"
                :osu-id="selectedIndividualRound.bn.osuId"
                :username="selectedIndividualRound.bn.username"
                :nominator-assessment-mongo-id="selectedIndividualRound.id"
            />
        </template>
    </current-bn-info>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserList from '../info/UserList.vue';
import EvaluatorAssignments from '../info/EvaluatorAssignments.vue';
import CurrentBnInfo from './CurrentBnInfo.vue';

export default {
    name: 'CurrentBnIndividualInfo',
    components: {
        UserList,
        CurrentBnInfo,
        EvaluatorAssignments,
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedIndividualRound',
        ]),
        submittedEvaluators() {
            let evaluators = new Array;
            this.selectedIndividualRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });

            return evaluators;
        },
    },
    watch: {
        selectedIndividualRound() {
            history.pushState(null, 'Current BN Evaluations', `/bneval?eval=${this.selectedIndividualRound.id}`);
        },
    },
};
</script>
