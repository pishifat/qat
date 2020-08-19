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
import postData from '../../../mixins/postData.js';

export default {
    name: 'BnEvaluatorToggle',
    mixins: [postData],
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async switchUserGroup(e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const user = await this.executePost(`/users/${this.selectedUser.id}/switchUserGroup`, {}, e);

                if (user && !user.error) {
                    this.$store.commit('users/updateUser', user);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Changed user group`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>