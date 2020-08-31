<template>
    <div
        class="modal-header"
        :class="headerColor"
    >
        <h5 class="modal-title">
            <user-link
                class="font-weight-bold text-white"
                :osu-id="selectedUser.osuId"
                :username="selectedUser.username"
            />

            <mode-display
                :modes="selectedUser.modes"
            />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeDisplay from '../../ModeDisplay.vue';
import UserLink from '../../UserLink.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
        UserLink,
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
        headerColor () {
            if (!this.selectedUser) return '';

            if (this.selectedUser.probationModes.length && !this.selectedUser.isNat) {
                return 'bg-probation';
            } else if (!this.selectedUser.hasBasicAccess) {
                return 'bg-bright-blue-gray';
            }

            return 'bg-' + (this.selectedUser.groups.includes('nat') ? 'nat' : this.selectedUser.groups.includes('bn') ? 'bn' : '');
        },
    },
};
</script>
