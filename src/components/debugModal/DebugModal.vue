<template v-if="loggedInUser.isPishifat">
    <modal-dialog id="DebugMenu" title="Debug" modal-size="xl">
        <debug-modal-permissions />

        <hr>
    
        <debug-modal-user-info />
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import DebugModalPermissions from './DebugModalPermissions.vue';
import DebugModalUserInfo from './DebugModalUserInfo.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    components: {
        ModalDialog,
        DebugModalPermissions,
        DebugModalUserInfo,
    },
    computed: mapState([
        'loggedInUser',
    ]),
}
</script>
