<template>
    <div>
        <p>
            <button
                class="btn btn-sm btn-block ml-2"
                :class="{ 'btn-danger': selectedUser.isBn, 'btn-bn': selectedUser.isNat }"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle user group"
                @click="switchUserGroup($event)"
            >
                {{ selectedUser.isBn ? 'Move to NAT' : 'Move to BN' }}
            </button>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'BnEvaluatorToggle',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async switchUserGroup(e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/switchUserGroup`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>