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

            <!-- show mediations to NAT if they're not active mediators -->
            <div v-if="showMediations">
                <hr>
                <mediations />
                <hr>
            </div>

            <!-- show admin buttons to NAT who aren't active mediators -->
            <admin-buttons
                v-if="isNat && !isMediator"
            />

            <!-- show mediation input for active mediators -->
            <mediation-input
                v-else-if="isMediator && selectedVeto.status == 'wip'"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Context from './info/Context.vue';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import MediationInput from './info/MediationInput.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'VetoInfo',
    components: {
        ModalHeader,
        Context,
        Mediations,
        AdminButtons,
        MediationInput,
        ModalDialog,
    },
    computed: {
        ...mapState([
            'userId',
            'userOsuId',
            'isNat',
        ]),
        ...mapGetters([
            'selectedVeto',
            'isMediator',
        ]),
        showMediations() {
            if (this.selectedVeto.mediations.length) {
                // NAT can see only if they're not mediators
                if (this.isNat && !this.isMediator) {
                    return true;
                // everyone can see when upheld/withdrawn
                } else if (this.selectedVeto.status == 'upheld' || this.selectedVeto.status == 'withdrawn') {
                    return true;
                }
            }

            return false;
        },
    },
    watch: {
        selectedVeto () {
            history.pushState(null, 'Vetoes', `/vetoes?id=${this.selectedVeto.id}`);
        },
    },
};
</script>
