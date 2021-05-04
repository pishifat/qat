<template>
    <modal-dialog id="globalSettings" title="Settings">
        <settings-modal-evaluator />

        <hr>

        <settings-modal-requests />

        <hr>

        <settings-modal-discord />

        <hr>

        <settings-modal-mode-evaluations v-if="loggedInUser.isNat" />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import SettingsModalEvaluator from './SettingsModalEvaluator.vue';
import SettingsModalDiscord from './SettingsModalDiscord.vue';
import SettingsModalModeEvaluations from './SettingsModalModeEvaluations.vue';
import SettingsModalRequests from './SettingsModalRequests.vue';

export default {
    components: {
        ModalDialog,
        SettingsModalModeEvaluations,
        SettingsModalDiscord,
        SettingsModalRequests,
        SettingsModalEvaluator,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
