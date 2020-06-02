<template>
    <div
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12 my-2"
        @click="$emit('select-evaluation-round')"
    >
        <div
            class="card"
            :class="[isSelected ? 'bg-nat' : '', 'border-' + findRelevantEval, isNatEvaluator ? 'bg-info' : '']"
            data-toggle="modal"
            :data-target="target"
        >
            <card-header
                :username="evaluationRound.bn.username"
                :osu-id="evaluationRound.bn.osuId"
                :consensus="evaluationRound.consensus"
            />
            <card-footer
                :mode="evaluationRound.mode"
                :nominator-assessment-mongo-id="evaluationRound.id"
                :evaluations="evaluationRound.evaluations"
                :is-discuss="isDiscuss"
                :date="evaluationRound.deadline"
                :is-archive="isArchive"
                :feedback="evaluationRound.feedback"
                @check-selection="checkSelection()"
            />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import CardHeader from '../card/CardHeader.vue';
import CardFooter from '../card/CardFooter.vue';

export default {
    name: 'EvaluationCard',
    components: {
        CardHeader,
        CardFooter,
    },
    props: {
        evaluationRound: {
            type: Object,
            required: true,
        },
        target: {
            type: String,
            required: true,
        },
        allChecked: Boolean,
        isDiscuss: Boolean,
        isApplication: Boolean,
        isArchive: Boolean,
    },
    data() {
        return {
            isSelected: false,
        };
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
        findRelevantEval () {
            const evaluation = this.evaluationRound.evaluations.find(e => e.evaluator.id == this.evaluator.id);

            if (evaluation) {
                switch (evaluation.vote) {
                    case 1:
                        return 'pass';
                    case 2:
                        return 'neutral';
                    case 3:
                        return 'fail';
                }
            }

            return '';
        },
        isNatEvaluator() {
            return this.evaluationRound.natEvaluators && this.evaluationRound.natEvaluators.some(e => e.id == this.evaluator.id);
        },
    },
    watch: {
        allChecked() {
            this.checkSelection();
        },
    },
    methods: {
        checkSelection() {
            if ($(`#${this.evaluationRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
    },
};
</script>
