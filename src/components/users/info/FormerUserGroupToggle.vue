<template>
    <div class="d-inline-flex align-items-center">
        <b>
            User group:
        </b>
        <mode-select
            v-model="selectedMode"
            :max-selection="1"
            class="ml-1"
        />
        <button
            class="btn btn-sm btn-nat ml-1 mb-1"
            href="#"
            @click.prevent="addToNat()"
        >
            Move to NAT
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeSelect from '../../ModeSelect.vue';

export default {
    name: 'FormerUserGroupToggle',
    components: {
        ModeSelect,
    },
    data() {
        return {
            selectedMode: '',
        };
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async addToNat() {
            const result = confirm(`Are you sure?`);

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/addToNat`, { mode: this.selectedMode });

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>
