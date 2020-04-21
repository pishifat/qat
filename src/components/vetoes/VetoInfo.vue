<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="veto" class="modal-content">
                <modal-header
                    :mode="veto.mode"
                    :beatmap-id="parseInt(veto.beatmapId, 10)"
                    :beatmap-mapper="veto.beatmapMapper"
                    :beatmap-mapper-id="parseInt(veto.beatmapMapperId, 10)"
                    :beatmap-title="veto.beatmapTitle"
                    :status="veto.status"
                />
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <context
                            :veto="veto"
                        />

                        <span v-if="isNat && veto.mediations.length && (!isMediator || veto.status != 'wip')">
                            <hr>
                            <mediations
                                :mediations="veto.mediations"
                                :status="veto.status"
                                :veto-id="veto.id"
                                @update-veto="$emit('update-veto', $event)"
                            />

                            <hr>
                        </span>
                        <span v-if="isNat && !isMediator">
                            <admin-buttons
                                :current-mediators="currentMediators"
                                :veto="veto"
                                @update-veto="$emit('update-veto', $event)"
                            />
                        </span>

                        <mediation-input
                            v-else-if="isMediator && veto.status == 'wip'"
                            :mediations="veto.mediations"
                            :veto-id="veto.id"
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
import MediationInput from './info/MediationInput.vue';
import Mediations from './info/Mediations.vue';
import AdminButtons from './info/AdminButtons.vue';
import Context from './info/Context.vue';
import ModalHeader from './info/ModalHeader.vue';

export default {
    name: 'VetoInfo',
    components: {
        MediationInput,
        Mediations,
        AdminButtons,
        Context,
        ModalHeader,
    },
    props: {
        veto: {
            type: Object,
            default() {
                return {};
            },
        },
        userId: {
            type: String,
            default: '',
        },
        userOsuId: {
            type: Number,
            default: 0,
        },
        isNat: Boolean,
    },
    data () {
        return {
            mediators: null,
            vote: null,
        };
    },
    computed: {
        currentMediators () {
            let userIds = [];

            this.veto.mediations.forEach(mediation => {
                userIds.push(mediation.mediator.id);
            });

            if (this.veto.beatmapMapperId === this.userOsuId) {
                userIds.push(this.userId);
            }

            return userIds;
        },
        isMediator () {
            return this.currentMediators.indexOf(this.userId) >= 0;
        },
    },
    watch: {
        veto () {
            history.pushState(null, 'Vetoes', `/vetoes?beatmap=${this.veto.id}`);
        },
    },
};
</script>
