<template>
    <modal-dialog id="globalSettings" title="Settings">
        <settings-modal-evaluator />

        <hr>

        <settings-modal-requests />

        <hr>

        <settings-modal-preferences />

        <hr>

        <template v-if="loggedInUser.isNat">
            <settings-modal-discord />

            <hr>

            <settings-modal-mode-evaluations />
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
import SettingsModalPreferences from './SettingsModalPreferences.vue';

export default {
    components: {
        ModalDialog,
        SettingsModalModeEvaluations,
        SettingsModalDiscord,
        SettingsModalRequests,
        SettingsModalEvaluator,
        SettingsModalPreferences,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
