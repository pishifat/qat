<template>
    <div>
        <eval-page
            :individual-evaluations="individualRounds"
            :discussion-evaluations="discussRounds"
            @select-all="selectAll($event)"
            @set-group-eval="setGroupEval($event)"
            @set-individual-eval="setIndividualEval($event)"
            @set-complete="setComplete($event)"
        >
            <template #individual-evaluations-title>
                <button
                    class="btn btn-nat"
                    data-toggle="modal"
                    data-target="#addEvalRounds"
                    @click="openAddEvalRounds()"
                >
                    Add users to evaluate
                </button>
            </template>

            <template #individual-evaluations-cards>
                <current-bn-individual-card
                    v-for="evalRound in individualRounds"
                    :key="evalRound.id"
                    :eval-round="evalRound"
                    :all-checked="allChecked"
                />
            </template>

            <template #discussion-evaluations-cards>
                <current-bn-discussion-card
                    v-for="evalRound in discussRounds"
                    :key="evalRound.id"
                    :eval-round="evalRound"
                    :all-checked="allChecked"
                />
            </template>
        </eval-page>

        <current-bn-individual-info />

        <current-bn-discussion-info />

        <add-eval-rounds />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import AddEvalRounds from '../components/evaluations/AddEvalRounds.vue';
import CurrentBnIndividualCard from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualCard.vue';
import CurrentBnIndividualInfo from '../components/evaluations/currentBnEvaluations/CurrentBnIndividualInfo.vue';
import CurrentBnDiscussionCard from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionCard.vue';
import CurrentBnDiscussionInfo from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionInfo.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'BnEvalPage',
    components: {
        AddEvalRounds,
        CurrentBnIndividualCard,
        CurrentBnIndividualInfo,
        CurrentBnDiscussionCard,
        CurrentBnDiscussionInfo,
        EvalPage,
    },
    mixins: [ postData ],
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
        }, 21600000);
    },
    methods: {
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
                    this.$store.dispatch('updateToastMessages', {
                        message: `Set as group eval`,
                        type: 'success',
                    });
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
                    this.$store.dispatch('updateToastMessages', {
                        message: `Set as individual eval`,
                        type: 'success',
                    });
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
                        this.$store.dispatch('updateToastMessages', {
                            message: `Archived`,
                            type: 'success',
                        });
                    }
                }
            }
        },
    },
};
</script>