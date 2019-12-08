<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="selectApplication()"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval(), isNatEvaluator() ? 'card-bg-priority' : 'custom-bg-dark']"
            data-toggle="modal"
            data-target="#applicationIndividualInfo"
        >
            <card-header
                :username="application.applicant.username"
                :osuId="application.applicant.osuId"
            />
            <card-footer
                :mode="application.mode"
                :is-nat="evaluator.isNat"
                :is-leader="evaluator.isLeader"
                :nominator-assessment-mongo-id="application.id"
                :evaluations="application.evaluations"
                :is-discuss="false"
                :date="application.createdAt"
                :isExactDeadline="false"
                @check-selection="checkSelection()"
            />
        </div>
    </div>
</template>

<script>
import CardHeader from '../card/CardHeader.vue';
import CardFooter from '../card/CardFooter.vue';

export default {
    name: 'application-individual-card',
    components: {
        CardHeader,
        CardFooter
    },
    props: {
        application: Object,
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
        selectApplication() {
            this.$emit('update:selectedApplication', this.application);
        },
        findRelevantEval() {
            let vote;
            this.application.evaluations.forEach(ev => {
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
            if ($(`#${this.application.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
        isNatEvaluator() {
            for (let i = 0; i < this.application.natEvaluators.length; i++) {
                let user = this.application.natEvaluators[i];
                if(user.id == this.evaluator.id){
                    return true;
                }
            }
            return false;
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
