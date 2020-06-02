<template>
    <modal-dialog modal-size="xl">
        <template v-if="application" #header>
            <modal-header
                :mode="application.mode"
                :nat-evaluators="application.natEvaluators"
                :is-application="true"
                :osu-id="application.applicant.osuId"
                :username="application.applicant.username"
            />
        </template>

        <div v-if="application" class="container">
            <mods
                :mods="application.mods"
                :reasons="application.reasons"
                :osu-id="application.applicant.osuId"
            />

            <template v-if="evaluator.isNat">
                <test-results
                    :test-score="application.test.totalScore"
                    :osu-id="application.applicant.osuId"
                />

                <p>
                    <a href="#additionalInfo" data-toggle="collapse">
                        Additional info <i class="fas fa-angle-down" />
                    </a>
                </p>

                <div id="additionalInfo" class="collapse container">
                    <applicant-comment
                        v-if="application.test.comment"
                        :comment="application.test.comment"
                    />
                    <previous-evaluations
                        :user-mongo-id="application.applicant.id"
                    />
                    <user-notes
                        :user-mongo-id="application.applicant.id"
                    />
                    <slot name="additional-info" />
                </div>
            </template>

            <hr>

            <slot name="actions" />
        </div>
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalHeader from '../info/ModalHeader.vue';
import Mods from './applicationInfo/Mods.vue';
import TestResults from './applicationInfo/TestResults.vue';
import ApplicantComment from './applicationInfo/ApplicantComment.vue';
import PreviousEvaluations from '../info/PreviousEvaluations.vue';
import UserNotes from '../info/UserNotes.vue';
import ModalDialog from '../../ModalDialog.vue';

export default {
    name: 'ApplicationInfo',
    components: {
        ModalHeader,
        Mods,
        TestResults,
        ApplicantComment,
        PreviousEvaluations,
        UserNotes,
        ModalDialog,
    },
    props: {
        application: {
            type: Object,
            default: undefined,
        },
    },
    computed: {
        ...mapState([
            'evaluator',
        ]),
    },
};
</script>
