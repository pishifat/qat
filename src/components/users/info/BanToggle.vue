<template>
    <div>
        <p>
            <b>
                Banned from BN:
            </b>
            <a
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle user's ban from BN"
                href="#"
                @click.prevent="toggleIsBannedFromBn()"
            >
                <i v-if="selectedUser.isBannedFromBn" class="fas fa-check text-success" />
                <i v-else class="fas fa-times text-danger" />
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'TrialNatToggle',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async toggleIsBannedFromBn(e) {
            const data = await this.$http.executePost(`/users/nat/${this.selectedUser.id}/toggleIsBannedFromBn`, {}, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('users/updateUser', data.user);
            }
        },
    },
};
</script>