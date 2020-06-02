<template>
    <evaluation-card
        target="#currentBnIndividualInfo"
        :evaluation-round="evalRound"
        :is-discuss="false"
        :all-checked="allChecked"
        @select-evaluation-round="selectEvalRound()"
    />
</template>

<script>
import EvaluationCard from './EvaluationCard.vue';

export default {
    name: 'CurrentBnIndividualCard',
    components: {
        EvaluationCard,
    },
    props: {
        evalRound: {
            type: Object,
            required: true,
        },
        allChecked: Boolean,
    },
    methods: {
        selectEvalRound() {
            this.$store.commit('setSelectedIndividualRoundId', this.evalRound.id);
        },
    },
};
</script>
