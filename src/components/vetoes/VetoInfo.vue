<template>
    <modal-dialog
        id="extendedInfo"
        modal-size="xl"
    >
        <template v-if="selectedVeto" #header>
            <modal-header />
        </template>

        <div v-if="selectedVeto" class="container">
            <!-- show veto reasons and include mediation responses when possible -->
            <context v-if="!showMediations" />
            <mediations v-else />
            <hr />

            <!-- show vouches component when  veto is "pending" status -->
            <vouches v-if="selectedVeto.status == 'pending' && loggedInUser && loggedInUser.isBnOrNat" />
            <div v-else-if="selectedVeto.status == 'pending'">
                Veto is currently pending. If enough Beatmap Nominators support it, a discussion will happen!
            </div>

            <!-- show chatroom component when veto is "chatroom" status -->
            <chatroom v-if="selectedVeto.status == 'chatroom' && loggedInUser && isChatroomUser" />
            <div v-else-if="selectedVeto.status == 'chatroom'">
                The veto is currently being discussed between the mapper(s) and Beatmap Nominators. If a conclusion can't be reached, a larger vote will be held!
            </div>

            <!-- show vote count to NATs during mediation period -->
            <vote-count 
                v-if="selectedVeto.status == 'wip' && loggedInUser && loggedInUser.isNat"
            />

            <!-- show admin buttons to NAT -->
            <admin-buttons
                v-if="loggedInUser && loggedInUser.isNat && (selectedVeto.status == 'available' || selectedVeto.status == 'wip' || selectedVeto.status == 'archive')"
            />

            <!-- show mediation input for active mediators -->
            <mediation-input
                v-if="isMediator && selectedVeto.status == 'wip'"
            />

            <!-- show debug info to admins -->
            <debug-view-document 
                v-if="loggedInUser && loggedInUser.isAdmin"
                :document="selectedVeto"
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
import Chatroom from './info/Chatroom.vue';

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
        Chatroom,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isMediator',
            'isChatroomUser',
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
