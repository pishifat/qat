<template>
    <div>
        <p>
            <b>
                User group:
            </b>
            <a
                class="ml-1"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle user group"
                href="#"
                @click.prevent="switchUserGroup()"
            >
                {{ selectedUser.isBn ? 'Move to NAT' : 'Move to BN' }}
            </a>
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
        async switchUserGroup() {
            const result = confirm(`Are you sure?`);

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/switchUserGroup`, {});

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>