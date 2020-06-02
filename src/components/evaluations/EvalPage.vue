<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <template v-if="evaluator && evaluator.isNat">
                    <button class="btn btn-block btn-nat my-1" @click="$emit('select-all', $event)">
                        Select all
                    </button>

                    <div class="sort-filter">
                        <span class="sort-filter__title--large">Mark selected as</span>
                        <button class="btn btn-nat btn-sm ml-2" @click="$emit('set-group-eval', $event)">
                            Group evaluation
                        </button>
                        <button class="btn btn-nat btn-sm ml-2" @click="$emit('set-individual-eval', $event)">
                            Individual evaluation
                        </button>
                        <button
                            class="btn btn-danger btn-sm ml-2"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Moves an evaluation to archives and applies its consensus to its user"
                            @click="$emit('set-complete', $event)"
                        >
                            Archive
                        </button>
                    </div>
                </template>
            </filter-box>

            <slot name="instructions" />

            <section class="card card-body">
                <h2>
                    Individual Evaluations
                    <sup
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Evaluations are hidden from others to avoid confirmation bias"
                    >
                        ?
                    </sup>
                    <small v-if="individualEvaluations">({{ individualEvaluations.length }})</small>
                    <slot name="individual-evaluations-title" />
                </h2>

                <transition-group name="list" tag="div" class="row">
                    <slot name="individual-evaluations-cards" />
                </transition-group>

                <div class="row">
                    <p v-if="!individualEvaluations || !individualEvaluations.length" class="ml-4">
                        Nothing to evaluate...
                    </p>
                </div>
            </section>

            <section class="card card-body">
                <h2>
                    {{ discussionsEvaluationsTitle }}
                    <sup
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="discussionsEvaluationsHelp"
                    >
                        ?
                    </sup>
                    <small v-if="discussionEvaluations">({{ discussionEvaluations.length }})</small>
                </h2>

                <transition-group name="list" tag="div" class="row">
                    <slot name="discussion-evaluations-cards" />
                </transition-group>

                <div class="row">
                    <p v-if="!discussionEvaluations || !discussionEvaluations.length" class="ml-4">
                        Nothing to evaluate...
                    </p>
                </div>
            </section>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../ToastMessages.vue';
import EvaluationInstructions from '../evaluations/applications/EvaluationInstructions.vue';
import FilterBox from '../FilterBox.vue';
import filters from '../../mixins/filters.js';
import postData from '../../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        ToastMessages,
        EvaluationInstructions,
        FilterBox,
    },
    mixins: [ postData, filters ],
    props: {
        discussionsEvaluationsTitle: {
            type: String,
            default: 'Group Evaluations',
        },
        discussionsEvaluationsHelp: {
            type: String,
            default: 'After individual evals are completed, their responses are made visible to allow discussion between NAT and form a consensus',
        },
        individualEvaluations: {
            type: Array,
            required: true,
        },
        discussionEvaluations: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            allChecked: false,
        };
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
    },
};
</script>
