<template>
    <div>
        <p class="d-flex flex-wrap align-items-center">
            <b>
                Discord ID:
            </b>
            <input
                v-if="editingIdInput"
                v-model="idInput"
                class="form-control form-control-sm w-25"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                @keyup.enter="save()"
            >
            <span v-else class="mx-1">{{ idInput }}</span>
            <a href="#" @click.prevent="save()">
                <i class="fas fa-edit ms-1" />
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'DiscordId',
    data () {
        return {
            idInput: '',
            editingIdInput: false,
        };
    },
    watch: {
        selectedUser() {
            this.idInput = this.selectedUser.discordId;
        },
    },
    mounted() {
        this.idInput = this.selectedUser.discordId;
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async save () {
            if (this.editingIdInput) {
                const res = await this.$http.executePost(`/users/updateDiscordId`, {
                    discordId: String(this.idInput).trim(),
                    userId: this.selectedUser.id,
                });

                if (this.$http.isValid(res)) {
                    let user = this.selectedUser;
                    user.discordId = res.discordId;
                    this.$store.commit('users/updateUser', user);
                }
            }

            this.editingIdInput = !this.editingIdInput;
        },
    },
};
</script>