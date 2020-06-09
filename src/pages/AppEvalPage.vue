<template>
    <div>
        <eval-page
            :individual-evaluations="individualApplications"
            :discussion-evaluations="discussApplications"
            :discussions-evaluations-title="
                evaluator && evaluator.isNat ?
                    'Group Evaluations' :
                    'Completed Evaluations'
            "
            :discussions-evaluations-help="
                evaluator && evaluator.isNat ?
                    'After individual evals are completed, their responses are made visible to allow discussion and form a consensus' :
                    'Results of archived evaluations you were assigned to'
            "
            @select-all="selectAll($event)"
            @set-group-eval="setGroupEval($event)"
            @set-individual-eval="setIndividualEval($event)"
            @set-complete="setComplete($event)"
        >
            <template #instructions>
                <evaluation-instructions />
            </template>

            <template #individual-evaluations-cards>
                <application-individual-card
                    v-for="application in individualApplications"
                    :key="application.id"
                    :application="application"
                    :all-checked="allChecked"
                />
            </template>

            <template #discussion-evaluations-cards>
                <application-discussion-card
                    v-for="application in discussApplications"
                    :key="application.id"
                    :application="application"
                    :all-checked="allChecked"
                />
            </template>
        </eval-page>

        <application-individual-info />

        <application-discussion-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import EvalPage from '../components/evaluations/EvalPage.vue';
import EvaluationInstructions from '../components/evaluations/applications/EvaluationInstructions.vue';
import ApplicationIndividualCard from '../components/evaluations/applications/ApplicationIndividualCard.vue';
import ApplicationIndividualInfo from '../components/evaluations/applications/ApplicationIndividualInfo.vue';
import ApplicationDiscussionCard from '../components/evaluations/applications/ApplicationDiscussionCard.vue';
import ApplicationDiscussionInfo from '../components/evaluations/applications/ApplicationDiscussionInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        ToastMessages,
        EvalPage,
        EvaluationInstructions,
        ApplicationIndividualCard,
        ApplicationIndividualInfo,
        ApplicationDiscussionCard,
        ApplicationDiscussionInfo,
    },
    mixins: [ postData ],
    data() {
        return {
            allChecked: false,
        };
    },
    computed: {
        ...mapState([
            'applications',
            'evaluator',
        ]),
        ...mapGetters([
            'individualApplications',
            'discussApplications',
        ]),
    },
    async created() {
        const res = await this.executeGet('/appEval/relevantInfo');

        if (res) {
            this.$store.commit('setApplications', res.applications);
            this.$store.commit('setEvaluator', res.evaluator);
            this.$store.commit('setFilterMode', res.evaluator.modes[0] || 'osu');

            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('eval') && params.get('eval').length) {
                const i = this.applications.findIndex(a => a.id == params.get('eval'));

                if (i >= 0) {
                    if (!this.applications[i].discussion) {
                        this.$store.commit('setSelectedIndividualApplicationId', params.get('eval'));
                        $('#applicationIndividualInfo').modal('show');
                    } else {
                        this.$store.commit('setSelectedDiscussApplicationId', params.get('eval'));
                        $('#applicationDiscussionInfo').modal('show');
                    }
                } else if (this.evaluator.isNat) {
                    //window.location = '/evalArchive?eval=' + params.get('eval');
                }
            }
        }

        $('#loading').fadeOut();
        $('#main').attr('style', 'visibility: visible').hide().fadeIn();
    },
    mounted () {
        setInterval(async () => {
            const res = await this.executeGet('/appEval/relevantInfo');

            if (res) {
                this.$store.commit('setApplications', res.a);
            }
        }, 21600000);
    },
    methods: {
        async setGroupEval(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });

            if (checkedApps.length) {
                const result = confirm(`Are you sure?`);

                if (result) {
                    const applications = await this.executePost('/appEval/setGroupEval/', { checkedApps }, e);

                    if (applications && !applications.error) {
                        this.$store.commit('setApplications', applications);
                        this.$store.dispatch('updateToastMessages', {
                            message: `Set as group eval`,
                            type: 'success',
                        });
                    }
                }
            }
        },
        async setIndividualEval(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });

            if (checkedApps.length) {
                const result = confirm(`Are you sure?`);

                if (result) {
                    const applications = await this.executePost('/appEval/setIndividualEval/', { checkedApps }, e);

                    if (applications && !applications.error) {
                        this.$store.commit('setApplications', applications);
                        this.$store.dispatch('updateToastMessages', {
                            message: `Set as individual eval`,
                            type: 'success',
                        });
                    }
                }
            }
        },
        async setComplete(e) {
            let checkedApps = [];
            $('input[name=\'evalTypeCheck\']:checked').each( function () {
                checkedApps.push( $(this).val() );
            });

            if (checkedApps.length) {
                const result = confirm(`Are you sure? The consensus of any evaluation will affect its respective user.\n\nOnly do this after feedback PMs have been sent.`);

                if (result) {
                    const applications = await this.executePost('/appEval/setComplete/', { checkedApps }, e);

                    if (applications && !applications.error) {
                        this.$store.commit('setApplications', applications);
                        this.$store.dispatch('updateToastMessages', {
                            message: `Archived`,
                            type: 'success',
                        });
                    }
                }
            }
        },
        selectAll() {
            let checkBoxes = $('input[name=\'evalTypeCheck\'');
            checkBoxes.prop('checked', !checkBoxes.prop('checked'));
            this.allChecked = !this.allChecked;
        },
    },
};
</script>
