<template>
    <div>
        <p>
            <b>
                Trial NAT:
            </b>
            <a
                class="ml-1"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle trial NAT"
                href="#"
                @click.prevent="toggleIsTrialNat()"
            >
                <i v-if="selectedUser.isTrialNat" class="fas fa-check text-success" />
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
        async toggleIsTrialNat(e) {
            const data = await this.$http.executePost(`/users/nat/${this.selectedUser.id}/toggleIsTrialNat`, {}, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('users/updateUser', data.user);
            }
        },
    },
};
</script>