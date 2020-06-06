<template>
    <div
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12 my-2"
        @click="$emit('select-application')"
    >
        <div
            class="card cursor-pointer"
            :class="[isSelected ? 'bg-blue-gray' : '', 'border-' + findRelevantEval, isNatEvaluator ? 'bg-primary' : '']"
            data-toggle="modal"
            :data-target="target"
        >
            <card-header
                :username="application.applicant.username"
                :mode="application.mode"
                :osu-id="application.applicant.osuId"
                :consensus="application.consensus"
            />
            <card-footer
                :nominator-assessment-mongo-id="application.id"
                :evaluations="application.evaluations"
                :date="application.createdAt"
                :feedback="application.feedback"
                :is-discuss="isDiscuss"
                :is-application="isApplication"
                :is-archive="isArchive"
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
    name: 'ApplicationCard',
    components: {
        CardHeader,
        CardFooter,
    },
    props: {
        application: {
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
            const evaluation = this.application.evaluations.find(e => e.evaluator && e.evaluator.id == this.evaluator.id);

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
            return this.application.natEvaluators && this.application.natEvaluators.some(e => e.id == this.evaluator.id);
        },
    },
    watch: {
        allChecked() {
            this.checkSelection();
        },
    },
    methods: {
        checkSelection() {
            if ($(`#${this.application.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
    },
};
</script>
