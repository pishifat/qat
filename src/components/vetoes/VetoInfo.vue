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
            <!--show chatroom archive when veto is in mediation phases-->
            <div
                v-if="
                    selectedVeto.status != 'pending' &&
                        selectedVeto.status != 'chatroom' &&
                        loggedInUser.isNat &&
                        selectedVeto.vetoFormat >= 7"
            >
                <a href="#chatroom" data-bs-toggle="collapse">
                    <b>Discussion logs</b> <i class="fas fa-angle-down" />
                </a>
                <chatroom
                    id="chatroom"
                    class="fake-disabled collapse"
                />
                <hr>
            </div>

            <!-- show vouches component when  veto is "pending" status -->
            <vouches v-if="selectedVeto.status == 'pending' && loggedInUser && loggedInUser.isBnOrNat" />
            <div v-else-if="selectedVeto.status == 'pending'">
                Veto is currently pending. If enough Beatmap Nominators support it, a discussion will happen!
            </div>

            <!-- show chatroom component when veto is "chatroom" status -->
            <chatroom
                v-if="
                    selectedVeto.status == 'chatroom' &&
                        loggedInUser &&
                        (isChatroomUser || loggedInUser.isNat)"
                :class="selectedVeto.chatroomLocked ? 'fake-disabled' : ''"
            />
            <div v-else-if="selectedVeto.status == 'chatroom'">
                The veto is currently being discussed between the mapper(s) and Beatmap Nominators. If a conclusion can't be reached, a larger vote will be held!
            </div>
            <pre-mediation-admin-buttons v-if="(selectedVeto.status == 'chatroom' || selectedVeto.status == 'pending') && loggedInUser && loggedInUser.isNat" />

            <!-- show admin buttons to NAT -->
            <begin-mediation
                v-if="loggedInUser && loggedInUser.isNat && selectedVeto.status == 'available'"
            />
            <div v-else-if="selectedVeto.status == 'available'">
                The veto discussion was inconclusive, so a mediation was requested. It'll begin soon!
            </div>

            <!-- show mediation input for active mediators -->
            <mediation-input
                v-if="selectedVeto.status == 'wip' && isMediator"
            />
            <div v-else-if="selectedVeto.status == 'wip'">
                <public-mediation-input v-if="loggedInUser && !loggedInUser.isBnOrNat && selectedVeto.vetoFormat >= 7" class="mt-4" />
                <div v-else-if="!loggedInUser">
                    If you want to give your opinion on the veto, log in.
                </div>
                <div v-else-if="loggedInUser.isBnOrNat && !loggedInUser.isNat">
                    There's nothing for you to do here.
                </div>
            </div>

            <div v-if="loggedInUser && !loggedInUser.isBnOrNat && selectedVeto.status == 'archive'">
                This veto has been concluded!
            </div>

            <admin-buttons
                v-if="loggedInUser && loggedInUser.isNat && (selectedVeto.status == 'wip' || selectedVeto.status == 'archive')"
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
import BeginMediation from './info/BeginMediation.vue';
import MediationInput from './info/MediationInput.vue';
import ModalDialog from '../ModalDialog.vue';
import DebugViewDocument from '../DebugViewDocument.vue';
import Context from './info/Context.vue';
import Vouches from './info/Vouches.vue';
import Chatroom from './info/Chatroom.vue';
import PreMediationAdminButtons from './info/PreMediationAdminButtons.vue';
import PublicMediationInput from './info/PublicMediationInput.vue';

export default {
    name: 'VetoInfo',
    components: {
        ModalHeader,
        Mediations,
        AdminButtons,
        BeginMediation,
        MediationInput,
        ModalDialog,
        DebugViewDocument,
        Context,
        Vouches,
        Chatroom,
        PreMediationAdminButtons,
        PublicMediationInput,
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

<style scoped>
.fake-disabled {
    pointer-events: none;
    opacity: 70%;
}
</style>