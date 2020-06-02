<template>
    <evaluation-card
        :target="isArchive ? '#currentBnArchiveInfo' : '#currentBnDiscussionInfo'"
        :evaluation-round="evalRound"
        :is-discuss="true"
        :all-checked="allChecked"
        :is-archive="isArchive"
        @select-evaluation-round="selectEvalRound()"
    />
</template>

<script>
import EvaluationCard from './EvaluationCard.vue';

export default {
    name: 'CurrentBnDiscussionCard',
    components: {
        EvaluationCard,
    },
    props: {
        evalRound: {
            type: Object,
            required: true,
        },
        allChecked: Boolean,
        isArchive: Boolean,
    },
    methods: {
        selectEvalRound() {
            this.$store.commit('setSelectedDiscussRoundId', this.evalRound.id);
        },
    },
};
</script>
