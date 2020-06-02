<template>
    <modal-dialog
        id="applicationArchiveInfo"
        modal-size="xl"
    >
        <template v-if="selectedDiscussApplication" #header>
            <modal-header
                :mode="selectedDiscussApplication.mode"
                :nat-evaluators="selectedDiscussApplication.natEvaluators"
                :is-application="true"
                :osu-id="selectedDiscussApplication.applicant.osuId"
                :username="selectedDiscussApplication.applicant.username"
            />
        </template>

        <div v-if="selectedDiscussApplication" class="container">
            <mods
                :mods="selectedDiscussApplication.mods"
                :reasons="selectedDiscussApplication.reasons"
                :osu-id="selectedDiscussApplication.applicant.osuId"
            />

            <test-results
                v-if="evaluator.isNat"
                :test-score="selectedDiscussApplication.test.totalScore"
                :osu-id="selectedDiscussApplication.applicant.osuId"
            />

            <consensus
                :is-application="true"
                :is-archive="true"
            />

            <p>
                <b>Application Feedback:</b>
            </p>

            <div class="card card-body pre-line small" v-html="filterLinks(selectedDiscussApplication.feedback)" />

            <hr v-if="selectedDiscussApplication.consensus">

            <evaluations
                :evaluations="selectedDiscussApplication.evaluations"
                :consensus="selectedDiscussApplication.consensus"
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
import filterLinks from '../../../mixins/filterLinks.js';
import postData from '../../../mixins/postData.js';
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';
import ModalDialog from '../../ModalDialog.vue';

export default {
    name: 'ApplicationArchiveInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
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
            'selectedDiscussApplication',
        ]),
    },
    watch: {
        selectedDiscussApplication() {
            history.pushState(null, 'BN Application Evaluations', `/evalArchive?eval=${this.selectedDiscussApplication.id}`);
        },
    },
    methods: {
        async unarchive(e) {
            const result = confirm(`Are you sure? ${this.selectedDiscussApplication.consensus == 'pass' ? 'This will remove the user from the BN' : ''}`);

            if (result) {
                const er = await this.executePost('/evalArchive/unarchive/' + this.selectedDiscussApplication.id, { type: 'application' }, e);

                if (er) {
                    window.location = '/appeval?eval=' + this.selectedDiscussApplication.id;
                }
            }
        },
    },
};
</script>
