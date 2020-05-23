<template>
    <div id="currentBnArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussRound" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="selectedDiscussRound.mode"
                    :nat-evaluators="selectedDiscussRound.natEvaluators || []"
                    :is-application="false"
                    :osu-id="selectedDiscussRound.bn.osuId"
                    :username="selectedDiscussRound.bn.username"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <p class="text-shadow min-spacing mb-1">
                            Recent BN activity
                        </p>
                        <div class="container mb-3">
                            <user-activity
                                :osu-id="selectedDiscussRound.bn.osuId"
                                :modes="modes"
                                :deadline="selectedDiscussRound.deadline"
                                :mongo-id="selectedDiscussRound.bn.id"
                            />
                        </div>
                    </div>
                    <div class="container">
                        <hr>
                        <consensus
                            :consensus="selectedDiscussRound.consensus"
                            :nominator-assessment-mongo-id="selectedDiscussRound.id"
                            :is-low-activity="selectedDiscussRound.isLowActivity"
                            :resigned-on-good-terms="selectedDiscussRound.resignedOnGoodTerms"
                            :resigned-on-standard-terms="selectedDiscussRound.resignedOnStandardTerms"
                            :is-application="false"
                            :is-archive="true"
                        />
                        <p class="min-spacing text-shadow">
                            Current BN Feedback:
                        </p>
                        <pre class="secondary-text pre-font text-shadow small ml-3" v-html="filterLinks(selectedDiscussRound.feedback)" />
                        <hr v-if="selectedDiscussRound.consensus">
                        <evaluations
                            :evaluations="selectedDiscussRound.evaluations"
                            :consensus="selectedDiscussRound.consensus"
                        />
                        <button
                            class="btn btn-sm btn-nat-red float-right"
                            @click="unarchive($event);"
                        >
                            Un-archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import filterLinks from '../../../mixins/filterLinks.js';
import postData from '../../../mixins/postData.js';
import UserActivity from './currentBnInfo/UserActivity.vue';
import ModalHeader from '../info/ModalHeader.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'CurrentBnArchiveInfo',
    components: {
        UserActivity,
        ModalHeader,
        Consensus,
        Evaluations,
    },
    mixins: [ filterLinks, postData ],
    computed: {
        ...mapState([
            'evaluator',
        ]),
        ...mapGetters([
            'selectedDiscussRound',
        ]),
        submittedEvaluators() {
            let evaluators = new Array;
            this.selectedDiscussRound.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });

            return evaluators;
        },
        modes() {
            let modes = [];
            if (this.selectedDiscussRound.bn.modes.length) modes = this.selectedDiscussRound.bn.modes;
            else modes.push(this.selectedDiscussRound.mode);

            return modes;
        },
    },
    watch: {
        selectedDiscussRound() {
            history.pushState(null, 'Current BN Evaluations', `/evalarchive?eval=${this.selectedDiscussRound.id}`);
        },
    },
    created() {
        if (this.selectedDiscussRound) {
            history.pushState(null, 'Current BN Evaluations', `/evalarchive?eval=${this.selectedDiscussRound.id}`);
        }
    },
    methods: {
        async unarchive(e) {
            const result = confirm(`Are you sure? This will place the user on probation`);

            if (result) {
                const er = await this.executePost('/evalArchive/unarchive/' + this.selectedDiscussRound.id, { type: 'evalRound' }, e);

                if (er) {
                    window.location = '/bnEval?eval=' + this.selectedDiscussRound.id;
                }
            }
        },
    },
};
</script>

<style>

</style>