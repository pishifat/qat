<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="selectEvalRound()"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval()]"
            data-toggle="modal"
            :data-target="isArchive ? '#currentBnArchiveInfo' : '#currentBnDiscussionInfo'"
            :data-user="evalRound.id"
        >
            <card-header
                :username="evalRound.bn.username"
                :osuId="evalRound.bn.osuId"
                :consensus="evalRound.consensus"
            />
            <card-footer
                :mode="evalRound.mode"
                :is-nat="evaluator.isNat"
                :is-leader="evaluator.isLeader"
                :nominator-assessment-mongo-id="evalRound.id"
                :evaluations="evalRound.evaluations"
                :is-discuss="true"
                :date="evalRound.deadline"
                :is-archive="isArchive"
                :feedback="evalRound.feedback"
                @check-selection="checkSelection()"
            />
        </div>
    </div>
</template>

<script>
import CardHeader from '../card/CardHeader.vue';
import CardFooter from '../card/CardFooter.vue';

export default {
    name: 'current-bn-discussion-card',
    components: {
        CardHeader,
        CardFooter
    },
    props: {
        evalRound: Object,
        evaluator: Object,
        allChecked: Boolean,
        isArchive: Boolean,
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
            this.$emit('update:selected-discuss-round', this.evalRound);
        },
        findRelevantEval() {
            let vote;
            this.evalRound.evaluations.forEach(ev => {
                if (ev.evaluator.id == this.evaluator.id) {
                    if (ev.vote == 1) {
                        vote = 'pass';
                    } else if (ev.vote == 2) {
                        vote = 'extend';
                    } else {
                        vote = 'fail';
                    }
                }
            });
            return vote;
        },
        createDeadline(date) {
            date = new Date(date);
            date = new Date(date.setDate(date.getDate() + 14)).toString().slice(4, 10);
            return date;
        },
        checkSelection() {
            if ($(`#${this.evalRound.id}-check`).is(':checked')) {
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
