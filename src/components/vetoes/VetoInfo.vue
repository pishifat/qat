<template>
    <modal-dialog
        id="extendedInfo"
        modal-size="xl"
    >
        <template v-if="selectedVeto" #header>
            <modal-header />
        </template>

        <div v-if="selectedVeto" class="container">

            <!-- show mediations to NAT if they're not active mediators -->
            <mediations v-if="showMediations" />

            <!-- show context when mediations aren't visible -->
            <context v-else />

            <!-- show vouch info when map veto is "pending" status -->
            <vouches v-if="selectedVeto.status == 'pending' && loggedInUser.isBnOrNat" />

            <!-- show vote count to NATs -->
            <vote-count 
                v-if="loggedInUser && loggedInUser.isNat"
            />

            <!-- show debug info to admins -->
            <debug-view-document 
                v-if="loggedInUser && loggedInUser.isAdmin"
                :document="selectedVeto"
            />

            <!-- show admin buttons to NATs if veto is not "pending" -->
            <admin-buttons
                v-if="loggedInUser && loggedInUser.isNat && selectedVeto.status != 'pending'"
            />

            <!-- show mediation input for active mediators -->
            <mediation-input
                v-if="isMediator && selectedVeto.status == 'wip'"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import MediationInput from './info/MediationInput.vue';
import ModalDialog from '../ModalDialog.vue';
import DebugViewDocument from '../DebugViewDocument.vue';
import Context from './info/Context.vue';
import Vouches from './info/Vouches.vue';

export default {
    name: 'VetoInfo',
    components: {
        ModalHeader,
        Mediations,
        AdminButtons,
        MediationInput,
        ModalDialog,
        DebugViewDocument,
        Context,
        Vouches,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isMediator',
        ]),
        showMediations() {
            if (this.selectedVeto.mediations.length) {
                // NAT can see when active
                if (this.loggedInUser && this.loggedInUser.isNat) {
                    return true;
                // everyone can see when archived
                } else if (this.selectedVeto.status == 'archive') {
                    return true;
                }
            }

            return false;
        },
    },
};
</script>
