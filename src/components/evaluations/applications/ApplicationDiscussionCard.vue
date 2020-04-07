<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="selectApplication()"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval(), isNatEvaluator() ? 'card-bg-priority' : 'custom-bg-dark']"
            data-toggle="modal"
            :data-target="isArchive ? '#applicationArchiveInfo' : '#applicationDiscussionInfo'"
            :data-user="application.id"
        >
            <card-header
                :username="application.applicant.username"
                :osu-id="application.applicant.osuId"
                :is-nat="evaluator.isNat"
                :consensus="application.consensus"
            />
            <card-footer
                :mode="application.mode"
                :is-nat="evaluator.isNat"
                :nominator-assessment-mongo-id="application.id"
                :evaluations="application.evaluations"
                :is-discuss="true"
                :date="application.createdAt"
                :is-application="true"
                :is-archive="isArchive"
                :feedback="application.feedback"
                @check-selection="checkSelection()"
            />
        </div>
    </div>
</template>

<script>
import CardHeader from '../card/CardHeader.vue';
import CardFooter from '../card/CardFooter.vue';

export default {
    name: 'ApplicationDiscussionCard',
    components: {
        CardHeader,
        CardFooter,
    },
    props: {
        application: {
            type: Object,
            required: true,
        },
        evaluator: {
            type: Object,
            required: true,
        },
        allChecked: Boolean,
        isArchive: Boolean,
    },
    data() {
        return {
            pass: 0,
            neutral: 0,
            probation: 0,
            fail: 0,
            isSelected: false,
        };
    },
    computed: {
        consensus() {
            return this.application.consensus;
        },
    },
    watch: {
        allChecked() {
            this.checkSelection();
        },
    },
    methods: {
        selectApplication() {
            this.$emit('update:selected-application', this.application);
        },
        findRelevantEval() {
            let vote;
            this.application.evaluations.forEach(evaluation => {
                if (evaluation.evaluator.id == this.evaluator.id) {
                    if (evaluation.vote == 1) {
                        vote = 'pass';
                    } else if (evaluation.vote == 2) {
                        vote = 'neutral';
                    } else if (evaluation.vote == 3) {
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

                if (user.id == this.evaluator.id) {
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
