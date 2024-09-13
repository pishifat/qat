<template>
    <modal-dialog
        id="evaluationArchiveInfo"
        modal-size="xl"
    >
        <template v-if="selectedEvaluation" #header>
            <modal-header
                :mode="selectedEvaluation.mode"
                :nat-evaluators="selectedEvaluation.natEvaluators || []"
                :bn-evaluators="selectedEvaluation.bnEvaluators || []"
                :osu-id="selectedEvaluation.user.osuId"
                :username="selectedEvaluation.user.username"
                :is-application="selectedEvaluation.isApplication"
                :is-bn-evaluation="selectedEvaluation.isBnEvaluation"
            />
        </template>

        <div v-if="selectedEvaluation" class="container">
            <main-application-info v-if="selectedEvaluation.isApplication" />
            <user-activity
                v-else
                :osu-id="selectedEvaluation.user.osuId"
                :modes="modes"
                :deadline="selectedEvaluation.deadline"
                :mongo-id="selectedEvaluation.user.id"
                :unique="selectedEvaluation.id"
                :overwrite-days="selectedEvaluation.activityToCheck ? selectedEvaluation.activityToCheck + 7 : 90 + 7"
                :is-nat="selectedEvaluation.user.isNat"
                :user="selectedEvaluation.user"
            />

            <evaluation-link />

            <consensus />

            <div v-if="selectedEvaluation.isApplication && selectedEvaluation.consensus == 'pass' && selectedEvaluation.natBuddy">
                <p>
                    <b>NAT Buddy:</b>
                    <user-link
                        :class="selectedEvaluation.natBuddy.groups.includes('nat') ? 'text-nat' : selectedEvaluation.natBuddy.groups.includes('bn') ? 'text-probation' : ''"
                        :osu-id="selectedEvaluation.natBuddy.osuId"
                        :username="selectedEvaluation.natBuddy.username"
                    />
                </p>
            </div>

            <div v-if="!selectedEvaluation.isResignation && selectedEvaluation.feedback && selectedEvaluation.feedback !== 'None'">
                <p>
                    <b>Feedback:</b>
                </p>

                <div v-if="selectedEvaluation.feedback" class="card card-body small" v-html="$md.render(selectedEvaluation.feedback)" />

            </div>

            <hr>

            <reviews-listing 
                v-if="loggedInUser.isNatLeader || !isNatEvaluation"
            />

            <evaluation-messages
                :evaluation="selectedEvaluation"
                :is-new-evaluation-format="selectedEvaluation.isNewEvaluationFormat"
            />

            <debug-view-document 
                v-if="loggedInUser.isAdmin"
                :document="selectedEvaluation" 
            />

            <button
                class="btn btn-sm btn-danger float-right"
                @click="unarchive($event)"
            >
                Un-archive
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import Consensus from './common/Consensus.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import UserActivity from './currentBns/userActivity/UserActivity.vue';
import ModalDialog from '../../ModalDialog.vue';
import MainApplicationInfo from './applications/MainApplicationInfo.vue';
import { AppEvaluationConsensus } from '../../../../shared/enums';
import EvaluationLink from './common/EvaluationLink.vue';
import UserLink from '../../UserLink.vue';
import EvaluationMessages from './common/EvaluationMessages.vue';
import DebugViewDocument from '../../DebugViewDocument.vue';

export default {
    name: 'ArchiveInfo',
    components: {
        ModalHeader,
        Consensus,
        ReviewsListing,
        UserActivity,
        ModalDialog,
        MainApplicationInfo,
        EvaluationLink,
        UserLink,
        EvaluationMessages,
        DebugViewDocument,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string | string[]} */
        modes () {
            if (!this.selectedEvaluation) return [];
            
            if (this.selectedEvaluation.user.modes.length && !this.selectedEvaluation.user.modes.includes('none'))
                return this.selectedEvaluation.user.modes;

            return [this.selectedEvaluation.mode];
        },
        isNatEvaluation () {
            return ['remainInNat', 'moveToBn', 'removeFromNat'].includes(this.selectedEvaluation.consensus);
        },
    },
    methods: {
        async unarchive(e) {
            if (this.selectedEvaluation.isApplication) {
                const result = confirm(`Are you sure? ${this.selectedEvaluation.consensus === AppEvaluationConsensus.Pass ? 'This will remove the user from the BN' : ''}`);

                if (result) {
                    const data = await this.$http.executePost(`/evalArchive/${this.selectedEvaluation.id}/unarchiveApp`, e);

                    if (!data.error) {
                        $('#evaluationArchiveInfo').modal('hide');
                        this.$router.push('/appeval?id=' + this.selectedEvaluation.id);
                    }
                }
            } else {
                const result = confirm(`Are you sure? This will place the user on probation`);

                if (result) {
                    const data = await this.$http.executePost(`/evalArchive/${this.selectedEvaluation.id}/unarchiveBn`, e);

                    if (!data.error) {
                        $('#evaluationArchiveInfo').modal('hide');
                        this.$router.push('/bnEval?id=' + this.selectedEvaluation.id);
                    }
                }
            }
        },
    },
};
</script>
