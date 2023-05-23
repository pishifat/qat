<template>
    <div
        class="modal-header header d-flex flex-row align-items-center justify-content-between p-3"
        :style="cardDecoration"
    >
        <div class="d-flex flex-row align-items-center">
            <img :src="'https://a.ppy.sh/' + selectedUser.osuId" class="avatar-img mr-3">

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
        </div>
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
        /** @returns {string} */
        getCover() {
            return this.selectedUser.cover ? this.selectedUser.cover : '';
        },
        /** @returns {string} */
        getCardBackground() {
            const gradientColor = this.getCover ? 'rgba(0, 0, 0, 0.82)' : this.getUserColor;
            return `background: linear-gradient(90deg, ${this.getUserColor} 5%, ${gradientColor} 70%), url(${this.getCover}) center no-repeat; background-size: cover; object-fit: fill !important;`;
        },
        /** @returns {string} */
        cardDecoration() {
            let css = this.getCardBackground;
            return css += `border-bottom: 4px solid ${this.getUserColor};`;
        },
        /** @returns {string} */
        getUserColor() {
            if (this.selectedUser.probationModes.length && !this.selectedUser.isNat) {
                return 'var(--probation)';
            } else if (!this.selectedUser.hasBasicAccess) {
                return '';
            }
            return `var(--${(this.selectedUser.groups.includes('nat') ? 'danger' : this.selectedUser.groups.includes('bn') ? 'bn' : 'primary')})`;
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
    background-color: var(--gray-dark);
}

</style>
