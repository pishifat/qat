<template>
    <modal-dialog id="globalSettings" title="Settings">
        <settings-modal-evaluator />

        <hr>

        <settings-modal-requests />

        <hr>

        <settings-modal-nat v-if="loggedInUser.isNat" />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import SettingsModalEvaluator from './SettingsModalEvaluator.vue';
import SettingsModalNat from './SettingsModalNat.vue';
import SettingsModalRequests from './SettingsModalRequests.vue';

export default {
    components: {
        ModalDialog,
        SettingsModalNat,
        SettingsModalRequests,
        SettingsModalEvaluator,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
