<template>
    <modal-dialog
        id="extendedInfo"
        modal-size="xl"
    >
        <template v-if="selectedVeto" #header>
            <modal-header />
        </template>

        <div v-if="selectedVeto" class="container">
            <context />

            <!-- show vote count to NAT who aren't active mediators -->
            <vote-count 
                v-if="loggedInUser.isNat && selectedVeto.status == 'archive' && !isMediator" 
            />

            <!-- show mediations to NAT if they're not active mediators -->
            <div v-if="showMediations">
                <hr>
                <mediations />
                <hr>
            </div>

            <!-- show admin buttons to NAT who aren't active mediators -->
            <admin-buttons
                v-if="loggedInUser.isNat && !isMediator"
            />

            <!-- show mediation input for active mediators -->
            <mediation-input
                v-else-if="isMediator && selectedVeto.status == 'wip'"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Context from './info/Context.vue';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import MediationInput from './info/MediationInput.vue';
import ModalDialog from '../ModalDialog.vue';
import VoteCount from './info/VoteCount.vue';

export default {
    name: 'VetoInfo',
    components: {
        ModalHeader,
        Context,
        Mediations,
        AdminButtons,
        MediationInput,
        ModalDialog,
        VoteCount,
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
                // NAT can see only if they're not mediators
                if (this.loggedInUser.isNat && !this.isMediator) {
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
