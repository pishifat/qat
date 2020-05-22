<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
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
            <evaluation-instructions />
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        Individual Evaluations<sup
                            style="font-size: 12pt"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Evaluations are hidden from others to avoid confirmation bias"
                        >?</sup> <small v-if="individualApplications">({{ individualApplications.length }})</small>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <application-individual-card
                            v-for="application in individualApplications"
                            :key="application.id"
                            :application="application"
                            :all-checked="allChecked"
                        />
                    </transition-group>

                    <div class="row">
                        <p v-if="!individualApplications || !individualApplications.length" class="ml-4">
                            No applications to evaluate...
                        </p>
                    </div>
                </div>
            </section>
            <hr>
            <section class="row segment segment-image mx-1 px-0">
                <div class="col-sm-12">
                    <h2>
                        {{ evaluator && evaluator.isNat ? 'Group Evaluations' : 'Completed Evaluations' }}<sup
                            style="font-size: 12pt"
                            data-toggle="tooltip"
                            data-placement="top"
                            :title="evaluator && evaluator.isNat ? 'After individual evals are completed, their responses are made visible to allow discussion and form a consensus' : 'Results of archived evaluations you were assigned to'"
                        >?</sup>
                        <small v-if="discussApplications">({{ discussApplications.length }})</small>
                    </h2>

                    <transition-group name="list" tag="div" class="row">
                        <application-discussion-card
                            v-for="application in discussApplications"
                            :key="application.id"
                            :application="application"
                            :all-checked="allChecked"
                        />
                    </transition-group>

                    <div class="row">
                        <p v-if="!discussApplications || !discussApplications.length" class="ml-4">
                            No applications to evaluate...
                        </p>
                    </div>
                </div>
            </section>
        </div>

        <application-individual-info />

        <application-discussion-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import ApplicationIndividualCard from '../components/evaluations/applications/ApplicationIndividualCard.vue';
import ApplicationIndividualInfo from '../components/evaluations/applications/ApplicationIndividualInfo.vue';
import ApplicationDiscussionCard from '../components/evaluations/applications/ApplicationDiscussionCard.vue';
import ApplicationDiscussionInfo from '../components/evaluations/applications/ApplicationDiscussionInfo.vue';
import EvaluationInstructions from '../components/evaluations/applications/EvaluationInstructions.vue';
import FilterBox from '../components/FilterBox.vue';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        ToastMessages,
        ApplicationIndividualCard,
        ApplicationIndividualInfo,
        ApplicationDiscussionCard,
        ApplicationDiscussionInfo,
        EvaluationInstructions,
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
            this.$store.commit('setApplications', res.a);
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
        }, 300000);
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