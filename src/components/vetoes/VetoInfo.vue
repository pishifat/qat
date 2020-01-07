<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="veto" class="modal-content">
                <modal-header :veto="veto" />

                <modal-body :veto="veto" >
                    <mediations
                        :current-mediators="currentMediators"
                        :is-nat="isNat"
                        :majority="majority"
                        :user-id="userId"
                        :veto="veto"
                        @update-veto="$emit('update-veto', $event)"
                    />

                    <mediation-input
                        :comment="comment"
                        :mediation-id="mediationId"
                        :veto="veto"
                        :vote="vote"
                    />
                </modal-body>

                <modal-footer
                    :comment="comment"
                    :mediation-id="mediationId"
                    :veto="veto"
                    :vote="vote"
                    @update-veto="$emit('update-veto', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script>
import MediationInput from './info/MediationInput.vue';
import Mediations from './info/Mediations.vue';
import ModalBody from './info/ModalBody.vue';
import ModalFooter from './info/ModalFooter.vue';
import ModalHeader from './info/ModalHeader.vue';

export default {
    name: 'VetoInfo',
    components: {
        MediationInput,
        Mediations,
        ModalHeader,
        ModalFooter,
        ModalBody,
    },
    props: {
        veto: Object,
        userId: String,
        userOsuId: Number,
        isNat: Boolean,
    },
    data () {
        return {
            info: '',
            confirm: '',
            mediators: null,
            comment: '',
            vote: null,
            mediationId: null,
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

        majority () {
            let total = 0;

            this.veto.mediations.forEach(mediation => {
                if(mediation.vote === 1) total++;
                if(mediation.vote === 3) total--;
            });

            return total > 0 ? true : false;
        }
    },
    watch: {
        veto () {
            this.mediationId = null;

            if (this.veto.mediations.length) {
                for (let i = 0; i < this.veto.mediations.length; i++) {
                    let mediation = this.veto.mediations[i];

                    if(mediation.mediator.id === this.userId){
                        if(mediation.comment) this.comment = mediation.comment;
                        if(mediation.vote) this.vote = mediation.vote;

                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
            history.pushState(null, 'Vetoes', `/vetoes?beatmap=${this.veto.id}`);
        }
    },
};
</script>
