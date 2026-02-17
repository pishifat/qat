<template v-if="loggedInUser.isPishifat">
    <modal-dialog id="DebugMenu" title="Debug" modal-size="xl">
        <debug-modal-permissions />

        <hr>

        <debug-modal-user-info />

        <hr>

        <debug-modal-session-editor />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import DebugModalPermissions from './DebugModalPermissions.vue';
import DebugModalUserInfo from './DebugModalUserInfo.vue';
import DebugModalSessionEditor from './DebugModalSessionEditor.vue';

export default {
    components: {
        ModalDialog,
        DebugModalPermissions,
        DebugModalUserInfo,
        DebugModalSessionEditor,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
