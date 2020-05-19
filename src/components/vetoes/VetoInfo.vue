<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedVeto" class="modal-content">
                <modal-header />
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <context />

                        <!-- show mediations to NAT if they're not active mediators -->
                        <div v-if="isNat && selectedVeto.mediations.length && (!isMediator || selectedVeto.status != 'wip')">
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
                            :mediations="selectedVeto.mediations"
                            :veto-id="selectedVeto.id"
                            :user-id="userId"
                            @update-veto="$emit('update-veto', $event)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Context from './info/Context.vue';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import MediationInput from './info/MediationInput.vue';

export default {
    name: 'VetoInfo',
    components: {
        ModalHeader,
        Context,
        Mediations,
        AdminButtons,
        MediationInput,
    },
    computed: {
        ...mapState([
            'userId',
            'userOsuId',
            'isNat',
        ]),
        ...mapGetters([
            'selectedVeto',
            'currentMediators',
            'isMediator',
        ]),
    },
    watch: {
        selectedVeto () {
            history.pushState(null, 'Vetoes', `/vetoes?id=${this.selectedVeto.id}`);
        },
    },
};
</script>
