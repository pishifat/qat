<template>
    <section v-if="selectedVeto" class="container card card-body">
        <!-- show veto reasons and include mediation responses when possible -->
        <context v-if="!showMediations" />
        <mediations v-else />
        <vouches-display v-if="loggedInUser && loggedInUser.isNat && selectedVeto.vetoFormat >= 7 && selectedVeto.status != 'pending'" />

        <!--show chatroom archive when veto is in mediation phases, or to everyone when archived-->
        <div v-if="showChatroom" class="card mb-2">
            <button
                type="button"
                class="card-header py-2 w-100 text-start border-0 d-flex align-items-center text-decoration-none"
                data-bs-target="#chatroom"
                data-bs-toggle="collapse"
                aria-expanded="false"
                aria-controls="chatroom"
            >
                <b class="flex-grow-1">Discussion logs</b>
                <i class="fas fa-angle-down ms-1 collapse-chevron" />
            </button>
            <div id="chatroom" class="collapse">
                <chatroom class="fake-disabled" />
            </div>
        </div>
        <div v-else-if="selectedVeto.vetoFormat >= 7 && selectedVeto.status === 'archive'">
            <hr>
            <p class="text-muted">
                This veto never entered the discussion phase.
            </p>
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
                    selectedVeto.chatroomMessages &&
                    selectedVeto.chatroomMessages.length &&
                    loggedInUser &&
                    (isChatroomUser || loggedInUser.isNat)"
            :class="selectedVeto.chatroomLocked ? 'fake-disabled' : ''"
        />
        <veto-chatrooms />

        <hr />

        <veto-discussion-actions />

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
    </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import BeginMediation from './info/BeginMediation.vue';
import MediationInput from './info/MediationInput.vue';
import DebugViewDocument from '../DebugViewDocument.vue';
import Context from './info/Context.vue';
import Vouches from './info/Vouches.vue';
import Chatroom from './info/Chatroom.vue';
import VetoChatrooms from './info/VetoChatrooms.vue';
import PreMediationAdminButtons from './info/PreMediationAdminButtons.vue';
import PublicMediationInput from './info/PublicMediationInput.vue';
import VouchesDisplay from './info/VouchesDisplay.vue';
import VetoDiscussionActions from './info/VetoDiscussionActions.vue';

export default {
    name: 'VetoDetailContent',
    components: {
        Mediations,
        AdminButtons,
        BeginMediation,
        MediationInput,
        DebugViewDocument,
        Context,
        Vouches,
        Chatroom,
        VetoChatrooms,
        PreMediationAdminButtons,
        PublicMediationInput,
        VouchesDisplay,
        VetoDiscussionActions,
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isMediator',
            'isChatroomUser',
        ]),
        showMediations() {
            if (!this.selectedVeto?.mediations?.length) return false;
            if (this.loggedInUser && this.loggedInUser.isNat) return true;
            if (this.selectedVeto.status == 'archive') return true;
            return false;
        },
        showChatroom() {
            const v = this.selectedVeto;
            if (!v?.chatroomMessages?.length) return false;
            if (v.vetoFormat < 7) return false;
            if (v.status === 'chatroom') return false;
            if (v.status === 'archive') return true;
            const inMediationPhase = v.status === 'wip' || v.status === 'available';
            return inMediationPhase && this.loggedInUser?.isNat;
        },
    },
};
</script>

<style scoped>
.fake-disabled {
    opacity: 70%;
}

.fake-disabled :deep(button),
.fake-disabled :deep(input),
.fake-disabled :deep(textarea) {
    pointer-events: none;
}

.card-header[data-bs-toggle="collapse"] {
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-radius: 0.25rem;
}
.card-header[data-bs-toggle="collapse"]:hover {
    background-color: rgba(0, 0, 0, 0.1) !important;
    border-radius: 0.25rem;
}
.collapse-chevron {
    transition: transform 0.25s ease;
}
.card-header[data-bs-toggle="collapse"][aria-expanded="true"] .collapse-chevron {
    transform: rotate(180deg);
}
</style>
