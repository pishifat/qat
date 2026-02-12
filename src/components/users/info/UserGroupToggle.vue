<template>
    <div>
        <p>
            <b>
                User group ({{ formatMode(mode) }}):
            </b>
            <button
                class="btn btn-sm btn-nat ml-1 mb-1"
                href="#"
                @click.prevent="addToNat()"
            >
                Move to NAT
            </button>
            <button
                v-if="loggedInUser.isNatLeader && selectedUser.probationModes.includes(mode)"
                class="btn btn-sm btn-bn ml-1 mb-1"
                href="#"
                data-toggle="tooltip"
                title="For probation users who were supposed to join as full BN"
                @click.prevent="forceFullBn()"
            >
                Force full BN
            </button>
        </p>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'BnEvaluatorToggle',
    props: {
        mode: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async addToNat() {
            const result = confirm(`Are you sure?`);

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/addToNat`, { mode: this.mode });

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
        async forceFullBn() {
            const result = confirm(`Are you sure? Only do this if user is supposed to be a full BN.`);

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/forceFullBn`, { mode: this.mode });

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>