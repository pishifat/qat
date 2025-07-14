<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                :groups="kind == 'applications' ? null : ['', 'bn', 'nat']"
                store-module="evaluations"
            >
                <template v-if="loggedInUser.isNat">
                    <button class="btn btn-block btn-primary my-1" @click="selectAll()">
                        Select all
                    </button>

                    <div class="sort-filter sort-filter--small">
                        <span class="sort-filter__title--large">Mark selected as</span>
                        <button class="btn btn-primary btn-sm ml-2 mt-2" @click="setGroupEval($event)">
                            Group evaluation
                        </button>
                        <button class="btn btn-primary btn-sm ml-2 mt-2" @click="setIndividualEval($event)">
                            Individual evaluation
                        </button>
                        <button
                            class="btn btn-danger btn-sm ml-2 mt-2"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Moves an evaluation to archives and applies its consensus to its user"
                            @click="setComplete($event)"
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
                    <evaluation-card
                        v-for="evaluation in individualEvaluations"
                        :key="evaluation.id"
                        :evaluation="evaluation"
                        target="#evaluationInfo"
                        store-module="evaluations"
                    />
                </transition-group>

                <div class="row">
                    <p v-if="!individualEvaluations || !individualEvaluations.length" class="ml-4">
                        Nothing to evaluate...
                    </p>
                </div>
            </section>

            <section class="card card-body">
                <h2>
                    {{ discussionEvaluationsTitle }}
                    <sup
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="discussionEvaluationsHelp"
                    >
                        ?
                    </sup>
                    <small v-if="discussionEvaluations">({{ discussionEvaluations.length }})</small>
                </h2>
                <transition-group name="list" tag="div" class="row">
                    <evaluation-card
                        v-for="evaluation in discussionEvaluations"
                        :key="evaluation.id"
                        :evaluation="evaluation"
                        target="#evaluationInfo"
                        store-module="evaluations"
                    />
                </transition-group>

                <div class="row">
                    <p v-if="!discussionEvaluations || !discussionEvaluations.length" class="ml-4">
                        Nothing to evaluate...
                    </p>
                </div>
            </section>
        </div>

        <evaluation-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluationsModule from '../../store/evaluations';
import ToastMessages from '../ToastMessages.vue';
import FilterBox from '../FilterBox.vue';
import EvaluationCard from './card/EvaluationCard.vue';
import EvaluationInfo from './info/EvaluationInfo.vue';

export default {
    name: 'EvalPage',
    components: {
        ToastMessages,
        FilterBox,
        EvaluationCard,
        EvaluationInfo,
    },
    props: {
        discussionEvaluationsTitle: {
            type: String,
            default: 'Group Evaluations',
        },
        discussionEvaluationsHelp: {
            type: String,
            default: 'After individual evals are completed, their responses are made visible to allow discussion between NAT and form a consensus',
        },
        kind: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters([
            'userMainMode',
        ]),
        ...mapState('evaluations', [
            'evaluations',
            'checkedEvaluations',
        ]),
        ...mapGetters('evaluations', [
            'individualEvaluations',
            'discussionEvaluations',
        ]),
    },
    beforeCreate () {
        if (this.$store.hasModule('evaluations')) {
            this.$store.commit('evaluations/resetState');
        } else {
            this.$store.registerModule('evaluations', evaluationsModule);
        }
    },
    async created () {
        if (this.userMainMode) {
            this.$store.commit(`evaluations/pageFilters/setFilterMode`, this.userMainMode);
        }

        const data = await this.$http.initialRequest(`/${this.kind === 'applications' ? 'appEval' : 'bnEval'}/relevantInfo`);

        if (this.$http.isValid(data)) {
            this.$store.commit(`evaluations/setEvaluations`, data.evaluations);
            const id = this.$route.query.id;

            if (id) {
                const i = this.evaluations.findIndex(a => a.id == id);

                if (i >= 0) {
                    this.$store.commit(`evaluations/setSelectedEvaluationId`, id);
                    $('#evaluationInfo').modal('show');
                } else {
                    this.$router.push(`evalarchive?id=${id}`);
                }
            }
        }
    },
    mounted () {
        setInterval(async () => {
            const data = await this.$http.executeGet(`/${this.kind === 'applications' ? 'appEval' : 'bnEval'}/relevantInfo`);

            if (this.$http.isValid(data)) {
                this.$store.commit(`evaluations/setEvaluations`, data.evaluations);
            }
        }, 21600000);
    },
    methods: {
        selectAll() {
            this.$store.commit(`evaluations/updateCheckedEvaluations`, [
                ...this.individualEvaluations.map(a => a.id),
                ...this.discussionEvaluations.map(a => a.id),
            ]);
        },
        commitEvaluations (evaluations, message) {
            if (evaluations && !evaluations.error) {
                this.$store.commit(`evaluations/setEvaluations`, evaluations);
                this.$store.commit(`evaluations/updateCheckedEvaluations`, []);
                this.$store.dispatch('updateToastMessages', {
                    message,
                    type: 'success',
                });
            }
        },
        async setGroupEval(e) {
            if (this.checkedEvaluations.length) {
                const result = confirm(`Are you sure?`);

                if (result) {
                    let evaluations = [];

                    if (this.kind === 'applications') {
                        evaluations = await this.$http.executePost('/appEval/setGroupEval/', { evalIds: this.checkedEvaluations }, e);
                    } else {
                        evaluations = await this.$http.executePost('/bnEval/setGroupEval/', { evalIds: this.checkedEvaluations }, e);
                    }

                    this.commitEvaluations(evaluations, 'Set as group eval');
                }
            }
        },
        async setIndividualEval(e) {
            if (this.checkedEvaluations.length) {
                const result = confirm(`Are you sure?`);

                if (result) {
                    let evaluations = [];

                    if (this.kind === 'applications') {
                        evaluations = await this.$http.executePost('/appEval/setIndividualEval/', { evalIds: this.checkedEvaluations }, e);
                    } else {
                        evaluations = await this.$http.executePost('/bnEval/setIndividualEval/', { evalIds: this.checkedEvaluations }, e);
                    }

                    this.commitEvaluations(evaluations, 'Set as individual eval');
                }
            }
        },
        async setComplete(e) {
            if (this.checkedEvaluations.length) {
                let text = `Are you sure? The consensus of any BN evaluation will affect its respective user.\n\n`;

                if (this.loggedInUser.isNatLeader) {
                    text += `If you're archiving a NAT eval however, it will default their usergroup to NAT.`
                } else {
                    text += `Only do this after feedback PMs have been sent.`;
                }

                const result = confirm(text);

                if (result) {
                    let evaluations = [];

                    if (this.kind === 'applications') {
                        evaluations = await this.$http.executePost('/appEval/setComplete/', { evalIds: this.checkedEvaluations }, e);
                    } else {
                        evaluations = await this.$http.executePost('/bnEval/setComplete/', { evalIds: this.checkedEvaluations }, e);
                    }

                    this.commitEvaluations(evaluations, 'Archived');
                }
            }
        },
    },
};
</script>
t