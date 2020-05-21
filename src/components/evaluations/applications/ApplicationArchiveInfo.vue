<template>
    <div id="applicationArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedDiscussApp" class="modal-content custom-bg-dark">
                <modal-header
                    :osu-id="selectedDiscussApp.applicant.osuId"
                    :username="selectedDiscussApp.applicant.username"
                    :mode="selectedDiscussApp.mode"
                    :nat-evaluators="selectedDiscussApp.natEvaluators"
                    :is-application="true"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="selectedDiscussApp.mods"
                            :reasons="selectedDiscussApp.reasons"
                            :osu-id="selectedDiscussApp.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="selectedDiscussApp.test.totalScore"
                            :osu-id="selectedDiscussApp.applicant.osuId"
                        />
                        <consensus
                            :is-application="true"
                            :is-archive="true"
                        />
                        <p class="min-spacing text-shadow">
                            Application Feedback:
                        </p>
                        <pre class="secondary-text pre-font text-shadow small ml-4" v-html="filterLinks(selectedDiscussApp.feedback)" />
                        <hr v-if="selectedDiscussApp.consensus">
                        <evaluations
                            :evaluations="selectedDiscussApp.evaluations"
                            :is-nat="evaluator.isNat"
                            :consensus="selectedDiscussApp.consensus"
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
            'selectedDiscussApp',
        ]),
    },
    watch: {
        selectedDiscussApp() {
            history.pushState(null, 'BN Application Evaluations', `/evalArchive?eval=${this.selectedDiscussApp.id}`);
        },
    },
    created() {
        if (this.selectedDiscussApp) {
            history.pushState(null, 'BN Application Evaluations', `/evalArchive?eval=${this.selectedDiscussApp.id}`);
        }
    },
    methods: {
        async unarchive(e) {
            const result = confirm(`Are you sure? ${this.selectedDiscussApp.consensus == 'pass' ? 'This will remove the user from the BN' : ''}`);

            if (result) {
                const er = await this.executePost('/evalArchive/unarchive/' + this.selectedDiscussApp.id, { type: 'application' }, e);

                if (er) {
                    window.location = '/appeval?eval=' + this.selectedDiscussApp.id;
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