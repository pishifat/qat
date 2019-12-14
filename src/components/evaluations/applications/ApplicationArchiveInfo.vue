<template>
    <div id="applicationArchiveInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="application" class="modal-content custom-bg-dark">
                <modal-header
                    :mode="application.mode"
                    :nat-evaluators="application.natEvaluators"
                    :isApplication="true"
                    :osuId="application.applicant.osuId"
                    :username="application.applicant.username"
                    :evaluator-mongo-id="evaluator.id"
                />
                <div class="modal-body" style="overflow: hidden;">
                    <div class="container">
                        <mods
                            :mods="application.mods"
                            :osuId="application.applicant.osuId"
                        />
                        <test-results
                            v-if="evaluator.isNat"
                            :test-score="application.test.totalScore"
                            :osuId="application.applicant.osuId"
                        />
                        <consensus
                            :consensus="application.consensus"
                            :nominator-assessment-mongo-id="application.id"
                            :is-application="true"
                            :is-archive="true"
                            @update-nominator-assessment="$emit('update-application', $event);"
                        />
                        <p class="min-spacing text-shadow">
                            Application Feedback:
                        </p>
                        <pre class="secondary-text pre-font text-shadow small ml-2" v-html="filterLinks(application.feedback)" />
                        <hr v-if="application.consensus">
                        <evaluations
                            :evaluations="application.evaluations"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import Consensus from '../info/Consensus.vue';
import Evaluations from '../info/Evaluations.vue';

export default {
    name: 'application-archive-info',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        Consensus,
        Evaluations,
    },
    props: {
        application: Object,
        evaluator: Object,
    },
    mixins: [ filterLinks ],
    watch: {
        application() {
            history.pushState(null, 'BN Application Evaluations', `/evalArchive?eval=${this.application.id}`);
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
