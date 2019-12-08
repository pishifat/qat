<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="selectEvalRound()"
    >
        <div
            class="card border-outline custom-bg-dark"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval()]"
            data-toggle="modal"
            data-target="#currentBnIndividualInfo"
        >
            <card-header
                :username="evalRound.bn.username"
                :osuId="evalRound.bn.osuId"
            />
            <card-footer
                :mode="evalRound.mode"
                :is-nat="evaluator.isNat"
                :is-leader="evaluator.isLeader"
                :nominator-assessment-mongo-id="evalRound.id"
                :evaluations="evalRound.evaluations"
                :is-discuss="false"
                :date="evalRound.deadline"
                :isExactDeadline="true"
                @check-selection="checkSelection()"
            />
        </div>
    </div>
</template>

<script>
import CardHeader from '../card/CardHeader.vue';
import CardFooter from '../card/CardFooter.vue';

export default {
    name: 'current-bn-individual-card',
    components: {
        CardHeader,
        CardFooter
    },
    props: {
        evalRound: Object,
        evaluator: Object,
        allChecked: Boolean,
    },
    data() {
        return {
            isSelected: false,
        };
    },
    watch: {
        allChecked() {
            this.checkSelection();
        },
    },
    methods: {
        selectEvalRound() {
            this.$emit('update:selectedEvalRound', this.evalRound);
        },
        findRelevantEval() {
            let vote;
            this.evalRound.evaluations.forEach(ev => {
                if (ev.evaluator.id == this.evaluator.id) {
                    if (ev.vote == 1) {
                        vote = 'pass';
                    } else if (ev.vote == 2) {
                        vote = 'neutral';
                    } else {
                        vote = 'fail';
                    }
                }
            });
            return vote;
        },
        checkSelection() {
            if (this.evalRound && $(`#${this.evalRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
