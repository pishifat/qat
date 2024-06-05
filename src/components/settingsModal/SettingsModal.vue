<template>
    <modal-dialog id="globalSettings" title="Settings">
        <settings-modal-explicit />

        <template v-if="loggedInUser.isBnOrNat">
            <hr>

            <settings-modal-evaluator />

            <hr>

            <template v-if="loggedInUser.isBn && loggedInUser.modesInfo.some(m => m.mode === 'osu')">
                <settings-modal-subjective-eval-feedback />

                <hr>
            </template>

            <settings-modal-requests />

            <hr>

            <settings-modal-languages />
        </template>

        <template v-if="loggedInUser.hasFullReadAccess">
            <hr>

            <settings-modal-content-review />

            <hr>

            <settings-modal-discord />
        </template>

        <template v-if="loggedInUser.isNat">
            <hr>

            <settings-modal-mode-evaluations />

            <hr>

            <settings-modal-webhooks />
        </template>
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import SettingsModalEvaluator from './SettingsModalEvaluator.vue';
import SettingsModalDiscord from './SettingsModalDiscord.vue';
import SettingsModalModeEvaluations from './SettingsModalModeEvaluations.vue';
import SettingsModalRequests from './SettingsModalRequests.vue';
import SettingsModalLanguages from './SettingsModalLanguages.vue';
import SettingsModalExplicit from './SettingsModalExplicit.vue';
import SettingsModalWebhooks from './SettingsModalWebhooks.vue';
import SettingsModalContentReview from './SettingsModalContentReview.vue';
import SettingsModalSubjectiveEvalFeedback from './SettingsModalSubjectiveEvalFeedback.vue';

export default {
    components: {
        ModalDialog,
        SettingsModalModeEvaluations,
        SettingsModalDiscord,
        SettingsModalRequests,
        SettingsModalEvaluator,
        SettingsModalLanguages,
        SettingsModalExplicit,
        SettingsModalWebhooks,
        SettingsModalContentReview,
        SettingsModalSubjectiveEvalFeedback,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
