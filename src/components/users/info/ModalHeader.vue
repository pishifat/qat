<template>
    <div
        class="modal-header user-header d-flex flex-row align-items-center justify-content-between p-3"
        :style="userHeaderStyle"
    >
        <div class="d-flex flex-row align-items-center">
            <img :src="'https://a.ppy.sh/' + selectedUser.osuId" class="avatar-img me-3">

            <h5 class="modal-title">
                <user-link
                    class="fw-bold text-white"
                    :osu-id="selectedUser.osuId"
                    :username="selectedUser.username"
                />

                <mode-display
                    :modes="selectedUser.modes"
                />
            </h5>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
        /** @returns {string} */
        getCover() {
            return this.selectedUser.cover ? `url(${this.selectedUser.cover})` : `url(https://a.ppy.sh/${this.selectedUser.osuId})`;
        },
        /** @returns {string} */
        getUserColor() {
            if (this.selectedUser.probationModes.length && !this.selectedUser.isNat) {
                return 'var(--bs-probation)';
            } else if (!this.selectedUser.hasBasicAccess) {
                return 'var(--bs-primary)';
            }

            return `var(--bs-${(this.selectedUser.groups.includes('nat') ? 'danger' : this.selectedUser.groups.includes('bn') ? 'bn' : 'primary')})`;
        },
        /** @returns {Object} */
        userHeaderStyle() {
            return {
                background: `linear-gradient(0deg, ${this.getUserColor} -150%, rgba(0, 0, 0, 0.65) 130%), ${this.getCover} center no-repeat`,
                backgroundSize: 'cover',
                borderBottom: `4px solid ${this.getUserColor}`,
            };
        },
    },
};
</script>

<style scoped>

.avatar-img {
    top: calc(70% - 40px);
    left: -12px;
    width: 70px;
    height: 70px;
    max-width: 120px;
    max-height: 120px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--bs-gray-800);
}

.user-header {
    object-fit: fill;
}

</style>
