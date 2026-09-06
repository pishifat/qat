<template>
    <div>
        <penalty-history
            v-if="userId"
            :user-id="userId"
            :modes="gameplayModes"
            :lock-mode="false"
            :initial-mode="defaultMode"
            :can-create="Boolean(gameplayModes.length)"
            :refresh-nonce="refreshNonce"
        />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import PenaltyHistory from '../../penalties/PenaltyHistory.vue';

export default {
    name: 'UserPenalties',
    components: {
        PenaltyHistory,
    },
    props: {
        refreshNonce: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('users', ['selectedUser']),
        ...mapState('users', {
            filterMode: (state) => state.pageFilters.filters.mode,
        }),
        userId() {
            return this.selectedUser && this.selectedUser.id;
        },
        gameplayModes() {
            const modes = (this.selectedUser && this.selectedUser.modes) || [];

            return modes.filter(mode => mode && mode !== 'none');
        },
        defaultMode() {
            if (this.filterMode && this.gameplayModes.includes(this.filterMode)) {
                return this.filterMode;
            }

            return this.gameplayModes[0] || '';
        },
    },
};
</script>
