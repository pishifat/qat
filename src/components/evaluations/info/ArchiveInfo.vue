<template>
    <modal-dialog
        id="evaluationArchiveInfo"
        modal-size="xl"
    >
        <template v-if="selectedEvaluation" #header>
            <modal-header
                :mode="selectedEvaluation.mode"
                :nat-evaluators="selectedEvaluation.natEvaluators"
                :osu-id="selectedEvaluation.user.osuId"
                :username="selectedEvaluation.user.username"
                :is-application="isApplication"
            />
        </template>

        <div v-if="selectedEvaluation" class="container">
            <main-application-info v-if="isApplication" />
            <main-current-bn-info v-else />

            <consensus />

            <p>
                <b>Feedback:</b>
            </p>

            <div v-if="selectedEvaluation.feedback" class="card card-body small" v-html="$md.render(selectedEvaluation.feedback)" />

            <hr>

            <reviews-listing />

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
import postData from '../../../mixins/postData.js';
import ModalHeader from './ModalHeader.vue';
import Consensus from './common/Consensus.vue';
import ReviewsListing from './common/ReviewsListing.vue';
import ModalDialog from '../../ModalDialog.vue';
import MainApplicationInfo from './applications/MainApplicationInfo.vue';
import MainCurrentBnInfo from './currentBns/MainCurrentBnInfo.vue';

export default {
    name: 'ArchiveInfo',
    components: {
        ModalHeader,
        Consensus,
        ReviewsListing,
        ModalDialog,
        MainApplicationInfo,
        MainCurrentBnInfo,
    },
    mixins: [ postData ],
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
    },
    methods: {
        async unarchive(e) {
            if (this.isApplication) {
                const result = confirm(`Are you sure? ${this.selectedEvaluation.consensus == 'pass' ? 'This will remove the user from the BN' : ''}`);

                if (result) {
                    const er = await this.executePost('/evalArchive/unarchive/' + this.selectedEvaluation.id, { type: 'application' }, e);

                    if (er) {
                        this.$router.push('/appeval?id=' + this.selectedEvaluation.id);
                    }
                }
            } else {
                const result = confirm(`Are you sure? This will place the user on probation`);

                if (result) {
                    const er = await this.executePost('/evalArchive/unarchive/' + this.selectedEvaluation.id, { type: 'currentBn' }, e);

                    if (er) {
                        this.$router.push('/bnEval?id=' + this.selectedEvaluation.id);
                    }
                }
            }
        },
    },
};
</script>
