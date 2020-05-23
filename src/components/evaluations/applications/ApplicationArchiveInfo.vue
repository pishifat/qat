<template>
    <div id="applicationArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussApplication" class="modal-content custom-bg-dark">
                <modal-header
                    :osu-id="selectedDiscussApplication.applicant.osuId"
                    :username="selectedDiscussApplication.applicant.username"
                    :mode="selectedDiscussApplication.mode"
                    :nat-evaluators="selectedDiscussApplication.natEvaluators"
                    :is-application="true"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
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
                        <p class="min-spacing text-shadow">
                            Application Feedback:
                        </p>
                        <pre class="secondary-text pre-font text-shadow small ml-4" v-html="filterLinks(selectedDiscussApplication.feedback)" />
                        <hr v-if="selectedDiscussApplication.consensus">
                        <evaluations
                            :evaluations="selectedDiscussApplication.evaluations"
                            :consensus="selectedDiscussApplication.consensus"
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
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'ApplicationArchiveInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        Consensus,
        Evaluations,
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

<style>

.eval-bg-priority {
    background-color: rgb(38, 48, 63)!important;
    box-shadow: 5px 5px 5px 5px rgb(38, 48, 63);
}

</style>