<template>
    <modal-dialog
        id="currentBnArchiveInfo"
        modal-size="xl"
    >
        <template v-if="selectedDiscussRound" #header>
            <modal-header
                :mode="selectedDiscussRound.mode"
                :nat-evaluators="selectedDiscussRound.natEvaluators || []"
                :is-application="false"
                :osu-id="selectedDiscussRound.bn.osuId"
                :username="selectedDiscussRound.bn.username"
            />
        </template>

        <div v-if="selectedDiscussRound" class="container">
            <p>
                <b>Recent BN activity</b>
            </p>

            <user-activity
                :osu-id="selectedDiscussRound.bn.osuId"
                :modes="modes"
                :deadline="selectedDiscussRound.deadline"
                :mongo-id="selectedDiscussRound.bn.id"
            />

            <p>
                <a href="#additionalInfo" data-toggle="collapse">
                    Additional info <i class="fas fa-angle-down" />
                </a>
            </p>

            <div id="additionalInfo" class="collapse container">
                <previous-evaluations
                    :user-mongo-id="selectedDiscussRound.bn.id"
                />

                <user-notes
                    :user-mongo-id="selectedDiscussRound.bn.id"
                />

                <user-reports
                    :user-mongo-id="selectedDiscussRound.bn.id"
                />
            </div>

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

            <p>
                <b>Current BN Feedback:</b>
            </p>

            <div class="card card-body pre-line small" v-html="filterLinks(selectedDiscussRound.feedback)" />

            <hr v-if="selectedDiscussRound.consensus">

            <evaluations
                :evaluations="selectedDiscussRound.evaluations"
                :consensus="selectedDiscussRound.consensus"
            />

            <button
                class="btn btn-sm btn-danger float-right"
                @click="unarchive($event);"
            >
                Un-archive
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import filterLinks from '../../../mixins/filterLinks.js';
import postData from '../../../mixins/postData.js';
import UserActivity from './currentBnInfo/UserActivity.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import UserReports from './currentBnInfo/UserReports.vue';
import ModalHeader from '../info/ModalHeader.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';
import ModalDialog from '../../ModalDialog.vue';

export default {
    name: 'CurrentBnArchiveInfo',
    components: {
        UserActivity,
        PreviousEvaluations,
        UserNotes,
        UserReports,
        ModalHeader,
        Consensus,
        Evaluations,
        ModalDialog,
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
