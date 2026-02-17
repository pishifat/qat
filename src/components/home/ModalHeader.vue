<template>
    <div
        v-if="selectedUser"
        class="modal-header user-header d-flex flex-row align-items-center justify-content-between p-3"
        :style="userHeaderStyle"
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
                    :modes="modes"
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
import ModeDisplay from '../ModeDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
        UserLink,
    },
    data() {
        return {
            modes: [],
        };
    },
    computed: {
        ...mapGetters('usersHome', [
            'selectedUser',
        ]),
        /** @returns {Object} */
        userHeaderStyle() {
            if (!this.selectedUser) return {};

            return {
                background: `linear-gradient(0deg, ${this.getUserColor()} -150%, rgba(0, 0, 0, 0.65) 130%), ${this.getCover()} center no-repeat`,
                backgroundSize: 'cover',
                borderBottom: `4px solid ${this.getUserColor()}`,
            };
        },
    },
    watch: {
        selectedUser() {
            this.modes = this.getModes();
        },
    },
    mounted () {
        this.modes = this.getModes();
    },
    methods: {
        getModes () {
            return this.selectedUser ? this.selectedUser.modesInfo.map(m => m.mode) : ['osu', 'taiko', 'catch', 'mania'];
        },
        /** @returns {string} */
        getCover () {
            return this.selectedUser.cover ? `url(${this.selectedUser.cover})` : `url(https://a.ppy.sh/${this.selectedUser.osuId})`;
        },
        /** @returns {string} */
        getUserColor () {
            if (this.selectedUser.groups == 'nat') {
                return 'var(--danger)';
            }
            else if (this.selectedUser.groups == 'bn' && this.selectedUser.level == 'full') {
                return 'var(--bn)';
            }
            else return 'var(--probation)';
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

.user-header {
    object-fit: fill;
}

</style>
