<template v-if="loggedInUser.isPishifat">
    <modal-dialog id="DebugMenu" title="Debug" modal-size="xl">
        <debug-modal-permissions />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import DebugModalPermissions from './DebugModalPermissions.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    components: {
        ModalDialog,
        DebugModalPermissions,
    },
    computed: mapState([
        'loggedInUser',
    ]),
}
</script>
