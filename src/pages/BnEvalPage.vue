<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'username... (3+ characters)'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            >
                <slot>
                    <button v-if="evaluator && evaluator.isNat" class="btn btn-nat btn-sm ml-2" @click="selectAll($event)">
                        Select all
                    </button>
                </slot>
            </filter-box>
            <section v-if="evaluator && evaluator.isNat" class="row segment my-1 mx-4">
                <div class="small filter-box">
                    <span class="filter-header" style="width: 110px;">Mark selected as</span>
                    <button class="btn btn-nat btn-sm ml-2" @click="setGroupEval($event)">
                        Group evaluation
                    </button>
                    <button class="btn btn-nat btn-sm ml-2" @click="setIndividualEval($event)">
                        Individual evaluation
                    </button>
                    <button
                        class="btn btn-nat-red btn-sm ml-2"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Moves an evaluation to archives and applies its consensus to its user"
                        @click="setComplete($event)"
                    >
                        Archive
                    </button>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        Individual Evaluations<sup
                            style="font-size: 12pt"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Evaluations are hidden from others to avoid confirmation bias"
                        >?</sup> <small v-if="individualRounds">({{ individualRounds.length }})</small>
                        <button
                            class="btn btn-nat"
                            data-toggle="modal"
                            data-target="#addEvalRounds"
                            @click="openAddEvalRounds()"
                        >
                            Add users to evaluate
                        </button>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <current-bn-individual-card
                            v-for="evalRound in individualRounds"
                            :key="evalRound.id"
                            :eval-round="evalRound"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            :user-to-evaluate="evalRound.bn"
                            :mode="evalRound.mode"
                            @update:selected-eval-round="selectedEvalRound = $event"
                        />
                    </transition-group>

                    <p v-if="!individualRounds || !individualRounds.length" class="ml-4">
                        No BNs to evaluate...
                    </p>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        Group Evaluations<sup
                            style="font-size: 12pt"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="After individual evals are completed, their responses are made visible to allow discussion between NAT and form a consensus"
                        >?</sup> <small v-if="discussRounds">({{ discussRounds.length }})</small>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <current-bn-discussion-card
                            v-for="evalRound in discussRounds"
                            :key="evalRound.id"
                            :eval-round="evalRound"
                            :evaluator="evaluator"
                            :all-checked="allChecked"
                            @update:selected-discuss-round="selectedDiscussRound = $event"
                        />
                    </transition-group>

                    <p v-if="!discussRounds || discussRounds.length == 0" class="ml-4">
                        No BNs to evaluate...
                    </p>
                </div>
            </section>
        </div>

        <current-bn-individual-info />

        <current-bn-discussion-info />

        <add-eval-rounds
            @update-all-eval-rounds="updateAllEvalRounds($event)"
        />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import CurrentBnIndividualCard from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualCard.vue';
import CurrentBnIndividualInfo from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualInfo.vue';
import CurrentBnDiscussionCard from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionCard.vue';
import CurrentBnDiscussionInfo from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionInfo.vue';
import FilterBox from '../components/FilterBox.vue';
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';

export default {
    name: 'BnEvalPage',
    components: {
        ToastMessages,
        AddEvalRounds,
        CurrentBnIndividualCard,
        CurrentBnIndividualInfo,
        CurrentBnDiscussionCard,
        CurrentBnDiscussionInfo,
        FilterBox,
    },
    mixins: [ postData, filters ],
    data() {
        return {
            allChecked: false,
        };
    },
    computed: {
        ...mapState([
            'evalRounds',
            'evaluator',
        ]),
        ...mapGetters([
            'individualRounds',
            'discussRounds',
        ]),
    },
    async created() {
        const res = await this.executeGet('/bnEval/relevantInfo');

        if (res) {
            this.$store.commit('setEvalRounds', res.er);
            this.$store.commit('setEvaluator', res.evaluator);
            this.$store.commit('setFilterMode',  res.evaluator.modes[0] || 'osu');

            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('eval') && params.get('eval').length) {
                const i = this.evalRounds.findIndex(e => e.id == params.get('eval'));

                if (i >= 0) {
                    if (!this.evalRounds[i].discussion) {
                        this.$store.commit('setSelectedIndividualRoundId', params.get('eval'));
                        $('#currentBnIndividualInfo').modal('show');
                    } else {
                        this.$store.commit('setSelectedDiscussRoundId', params.get('eval'));
                        $('#currentBnDiscussionInfo').modal('show');
                    }
                } else {
                    window.location = '/evalArchive?eval=' + params.get('eval');
                }
            }
        }

        $('#loading').fadeOut();
        $('#main').attr('style', 'visibility: visible').hide().fadeIn();
    },
    mounted () {
        setInterval(async () => {
            const res = await this.executeGet('/bnEval/relevantInfo');

            if (res) {
                this.$store.commit('setEvalRounds', res.er);
            }
        }, 300000);
    },
    methods: {
        updateAllEvalRounds (evalRounds) {
            this.allObjs = evalRounds;
            this.filter();
        },
        selectAll() {
            let checkBoxes = $('input[name=\'evalTypeCheck\'');
            checkBoxes.prop('checked', !checkBoxes.prop('checked'));
            this.allChecked = !this.allChecked;
        },
        openAddEvalRounds() {
            $('input[type=checkbox]').each(function() {
                this.checked = false;
            });
        },
        async setGroupEval(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });

            if (checkedRounds.length) {
                const evalRounds = await this.executePost('/bnEval/setGroupEval/', { checkedRounds }, e);

                if (evalRounds && !evalRounds.error) {
                    this.$store.commit('setEvalRounds', evalRounds);
                }
            }
        },
        async setIndividualEval(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });

            if (checkedRounds.length) {
                const evalRounds = await this.executePost('/bnEval/setIndividualEval/', { checkedRounds }, e);

                if (evalRounds && !evalRounds.error) {
                    this.$store.commit('setEvalRounds', evalRounds);
                }
            }
        },
        async setComplete(e) {
            let checkedRounds = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedRounds.push( $(this).val() );
            });

            if (checkedRounds.length) {
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);

                if (result) {
                    const evalRounds = await this.executePost('/bnEval/setComplete/', { checkedRounds }, e);

                    if (evalRounds && !evalRounds.error) {
                        this.$store.commit('setEvalRounds', evalRounds);
                    }
                }
            }
        },
    },
};
</script>