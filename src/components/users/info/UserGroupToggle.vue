<template>
    <div>
        <p>
            <b>
                User group ({{ mode == 'osu' ? 'osu!' : 'osu!' + mode }}):
            </b>
            <a
                class="ml-1"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle user group"
                href="#"
                @click.prevent="addToNat()"
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
    props: {
        mode: {
            type: String,
            required: true,
        },
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
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/addToNat`, { mode: this.mode });

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>